import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { SimulationDevice } from '../src/types/scenario';
import { PktExtractionReport } from '../src/types/importer';

export const MAX_PKT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Inspects and parses a Cisco Packet Tracer .pkt / .pka buffer.
 * Performs genuine structural inspection, cryptographic container detection,
 * and XML parsing when unencrypted / exported XML is provided.
 */
export function inspectAndParsePktBuffer(
  buffer: Buffer,
  fileName: string
): PktExtractionReport {
  const fileSize = buffer.length;

  if (fileSize === 0) {
    return {
      fileName,
      fileSize: 0,
      sha256: '',
      detectedFormat: 'corrupt',
      formatDescription: 'Empty file (0 bytes)',
      extractionSuccess: false,
      message: 'The uploaded file is empty.',
      extractedDevices: [],
      extractedConnections: [],
      guidedFallbackRequired: true,
      notes: ['Zero-byte upload rejected.'],
    };
  }

  if (fileSize > MAX_PKT_FILE_SIZE_BYTES) {
    return {
      fileName,
      fileSize,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      detectedFormat: 'corrupt',
      formatDescription: 'File exceeds maximum size limit (10MB)',
      extractionSuccess: false,
      message: `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds 10MB limit.`,
      extractedDevices: [],
      extractedConnections: [],
      guidedFallbackRequired: true,
      notes: ['Exceeds safety limit for server-side memory buffer.'],
    };
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  // Check 1: Check for direct uncompressed XML (<PACKETTRACER or <?xml)
  const headerUtf8 = buffer.subarray(0, 1024).toString('utf8');
  if (headerUtf8.includes('<PACKETTRACER') || headerUtf8.includes('<?xml')) {
    const xmlContent = buffer.toString('utf8');
    const { devices, connections, notes } = parsePacketTracerXml(xmlContent);
    return {
      fileName,
      fileSize,
      sha256,
      detectedFormat: 'unencrypted_pt_xml',
      formatDescription: 'Packet Tracer Unencrypted XML Schema',
      extractionSuccess: devices.length > 0,
      message: `Extracted ${devices.length} devices and ${connections.length} connections from Packet Tracer XML.`,
      extractedDevices: devices,
      extractedConnections: connections,
      guidedFallbackRequired: devices.length === 0,
      notes,
    };
  }

  // Check 2: Check for embedded zlib stream (e.g. Qt qCompress or old PT format)
  for (let offset = 0; offset < Math.min(buffer.length - 2, 64); offset++) {
    if (
      buffer[offset] === 0x78 &&
      (buffer[offset + 1] === 0x9c || buffer[offset + 1] === 0x01 || buffer[offset + 1] === 0xda)
    ) {
      try {
        const inflated = zlib.inflateSync(buffer.subarray(offset));
        const inflatedStr = inflated.toString('utf8');
        if (inflatedStr.includes('<PACKETTRACER') || inflatedStr.includes('<DEVICE')) {
          const { devices, connections, notes } = parsePacketTracerXml(inflatedStr);
          return {
            fileName,
            fileSize,
            sha256,
            detectedFormat: 'unencrypted_pt_xml',
            formatDescription: 'Packet Tracer Compressed XML (zlib container)',
            extractionSuccess: devices.length > 0,
            message: `Extracted ${devices.length} devices from decompressed Packet Tracer XML.`,
            extractedDevices: devices,
            extractedConnections: connections,
            guidedFallbackRequired: devices.length === 0,
            notes,
          };
        }
      } catch {
        // Not a valid zlib stream at this offset
      }
    }
  }

  // Check 3: Check for Modern Cisco Packet Tracer 7.x/8.x encrypted binary container
  // Modern Packet Tracer .pkt files use Twofish-128 in EAX mode with Qt qCompress and proprietary Cisco keys.
  // The magic bytes typically start with non-ASCII high entropy (e.g., 0x9d, 0xa8, 0xf6...).
  const isCiscoEncrypted =
    (buffer.length >= 16 && (buffer[0] === 0x9d || buffer[0] === 0x9e || buffer[0] === 0x9f)) ||
    hasHighEntropy(buffer.subarray(0, 512));

  if (isCiscoEncrypted) {
    return {
      fileName,
      fileSize,
      sha256,
      detectedFormat: 'pt7_8_twofish_eax',
      formatDescription: 'Cisco Packet Tracer 7.x/8.x Encrypted Container (Twofish-128-EAX)',
      extractionSuccess: false,
      message:
        'Encrypted Packet Tracer 7.x/8.x binary container detected. Automated decryption requires Packet Tracer 7+ proprietary crypto keys. Guided Fallback mode activated: please review and confirm the lab topology and addressing below.',
      extractedDevices: [],
      extractedConnections: [],
      guidedFallbackRequired: true,
      notes: [
        `File SHA-256: ${sha256}`,
        `File size: ${fileSize} bytes`,
        'Binary encryption: Twofish-128 with EAX mode authentication',
        'Payload protection: Proprietary Cisco Packet Tracer binary encapsulation',
        'Guided Fallback: The .pkt artifact is preserved for download; topology and scenario checkpoints can be confirmed via the interactive editor.',
      ],
    };
  }

  // Fallback: Unsupported binary or unrecognized format
  return {
    fileName,
    fileSize,
    sha256,
    detectedFormat: 'unsupported_binary',
    formatDescription: 'Unrecognized Packet Tracer binary variant',
    extractionSuccess: false,
    message:
      'Unrecognized Packet Tracer binary format. Guided Fallback mode activated to allow manual topology definition.',
    extractedDevices: [],
    extractedConnections: [],
    guidedFallbackRequired: true,
    notes: [
      `File SHA-256: ${sha256}`,
      'The file does not match known unencrypted XML or standard PT7/8 crypto headers.',
    ],
  };
}

/**
 * Calculates Shannon entropy of a buffer slice. High entropy (> 7.0) indicates encryption or compression.
 */
function hasHighEntropy(buf: Buffer): boolean {
  if (buf.length === 0) return false;
  const freq: Record<number, number> = {};
  for (let i = 0; i < buf.length; i++) {
    freq[buf[i]] = (freq[buf[i]] || 0) + 1;
  }
  let entropy = 0;
  for (const byte in freq) {
    const p = freq[byte] / buf.length;
    entropy -= p * Math.log2(p);
  }
  return entropy > 6.8;
}

/**
 * Parses unencrypted Packet Tracer XML payload to extract devices, interfaces, and connections.
 */
function parsePacketTracerXml(xml: string): {
  devices: SimulationDevice[];
  connections: string[];
  notes: string[];
} {
  const devices: SimulationDevice[] = [];
  const connections: string[] = [];
  const notes: string[] = [];

  // Match <DEVICE ...> or <device ...> tags
  const deviceRegex = /<DEVICE[\s\S]*?<\/DEVICE>|<device[\s\S]*?<\/device>/gi;
  let devMatch: RegExpExecArray | null;

  while ((devMatch = deviceRegex.exec(xml)) !== null) {
    const devBlock = devMatch[0];

    const nameMatch = devBlock.match(/<NAME>(.*?)<\/NAME>|<name>(.*?)<\/name>/i);
    const typeMatch = devBlock.match(/<TYPE>(.*?)<\/TYPE>|<type>(.*?)<\/type>|<MODEL>(.*?)<\/MODEL>/i);
    const ipMatch = devBlock.match(/<IP_ADDRESS>(.*?)<\/IP_ADDRESS>|<ip>(.*?)<\/ip>|<IP>(.*?)<\/IP>/i);
    const maskMatch = devBlock.match(/<SUBNET_MASK>(.*?)<\/SUBNET_MASK>|<mask>(.*?)<\/mask>/i);
    const gwMatch = devBlock.match(/<DEFAULT_GATEWAY>(.*?)<\/DEFAULT_GATEWAY>|<gateway>(.*?)<\/gateway>/i);
    const dnsMatch = devBlock.match(/<DNS_SERVER>(.*?)<\/DNS_SERVER>|<dns>(.*?)<\/dns>/i);

    const name = nameMatch ? nameMatch[1] || nameMatch[2] : `Device-${devices.length + 1}`;
    let rawType = (typeMatch ? typeMatch[1] || typeMatch[2] || typeMatch[3] : 'PC').toUpperCase();

    let type: SimulationDevice['type'] = 'PC';
    if (rawType.includes('ROUTER')) type = 'Router';
    else if (rawType.includes('SERVER')) type = 'Server';
    else if (rawType.includes('SWITCH')) type = 'Switch';
    else type = 'PC';

    devices.push({
      name: name.trim(),
      type,
      ipAddress: ipMatch ? (ipMatch[1] || ipMatch[2] || ipMatch[3]).trim() : 'Unassigned',
      subnetMask: maskMatch ? (maskMatch[1] || maskMatch[2]).trim() : '255.255.255.0',
      defaultGateway: gwMatch ? (gwMatch[1] || gwMatch[2]).trim() : 'None',
      dnsServer: dnsMatch ? (dnsMatch[1] || dnsMatch[2]).trim() : undefined,
      role: `Extracted ${type} from Packet Tracer XML schema.`,
    });
  }

  // Match <LINK ...> or <link ...> or <CONNECTION ...>
  const linkRegex = /<LINK[\s\S]*?<\/LINK>|<link[\s\S]*?<\/link>|<CONNECTION[\s\S]*?<\/CONNECTION>/gi;
  let linkMatch: RegExpExecArray | null;

  while ((linkMatch = linkRegex.exec(xml)) !== null) {
    const linkBlock = linkMatch[0];
    const dev1 = linkBlock.match(/<DEVICE1>(.*?)<\/DEVICE1>|<source>(.*?)<\/source>/i);
    const dev2 = linkBlock.match(/<DEVICE2>(.*?)<\/DEVICE2>|<target>(.*?)<\/target>/i);
    if (dev1 && dev2) {
      connections.push(`${dev1[1] || dev1[2]} <-> ${dev2[1] || dev2[2]}`);
    }
  }

  notes.push(`Parsed unencrypted XML structure: found ${devices.length} devices, ${connections.length} connections.`);

  return { devices, connections, notes };
}
