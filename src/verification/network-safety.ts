import { BlockList, isIP } from "node:net";

const blocked4 = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4]
] as const) blocked4.addSubnet(network, prefix, "ipv4");

const blocked6 = new BlockList();
for (const [network, prefix] of [
  ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8], ["2001:db8::", 32]
] as const) blocked6.addSubnet(network, prefix, "ipv6");

export const isPublicAddress = (address: string): boolean => {
  const family = isIP(address);
  if (family === 4) return !blocked4.check(address, "ipv4");
  if (family === 6) return !blocked6.check(address, "ipv6");
  return false;
};
