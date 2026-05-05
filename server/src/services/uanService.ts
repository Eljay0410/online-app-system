
import crypto from "crypto";

const LENGTH = 8;
const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// generate random candidate
export const generateCandidate = (): string => {
  let result = "";

  for (let i = 0; i < LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, ALPHANUM.length);
    result += ALPHANUM[randomIndex];
  }

  return result;
};

// generate unique UAN
export const generateUniqueUAN = async (
  checkIfExists: (uan: string) => Promise<boolean>,
  maxAttempts = 30
): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateCandidate();

    const exists = await checkIfExists(candidate);

    if (!exists) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique UAN");
};