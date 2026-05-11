import { randomBytes } from "crypto";

function generateUanCandidate() {
  // Use 9 characters for the random part to provide >8 trillion combinations
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(9);
  let value = "";

  for (let index = 0; index < bytes.length; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }

  return `UAN-${value}`.toUpperCase();
}

export async function assignUan(client, userId, existingUan) {
  if (existingUan) return existingUan;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const candidate = generateUanCandidate();

    try {
      const result = await client.query(
        `UPDATE users
         SET uan = $1, updated_at = NOW()
         WHERE id = $2 AND (uan IS NULL OR uan = '')
         RETURNING uan`,
        [candidate, userId]
      );

      if (result.rowCount === 1) {
        return result.rows[0].uan;
      }

      const current = await client.query("SELECT uan FROM users WHERE id = $1", [
        userId,
      ]);
      if (current.rows[0]?.uan) return current.rows[0].uan;
    } catch (err) {
      if (err?.code === "23505") continue;
      throw err;
    }
  }

  throw new Error("Unable to generate a unique UAN. Please try again.");
}
