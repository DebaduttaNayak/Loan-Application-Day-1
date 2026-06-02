import { Router } from "express";
import { VerifyPanBody, VerifyAadhaarBody } from "@workspace/api-zod";

const router = Router();

// Verhoeff algorithm checksum for Aadhaar
function verhoeffCheck(num: string): boolean {
  const d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
  ];
  const p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8],
  ];
  const inv = [0,4,3,2,1,5,6,7,8,9];
  let c = 0;
  const reversed = num.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][parseInt(reversed[i], 10)]];
  }
  return c === 0 && inv[c] === 0;
}

// POST /api/verify/pan
router.post("/pan", async (req, res) => {
  const parsed = VerifyPanBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { pan, name } = parsed.data;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  // Simulate verification delay
  await new Promise(r => setTimeout(r, 600));

  if (!panRegex.test(pan)) {
    return res.json({
      verified: false,
      message: "PAN format is invalid. Expected format: AAAAA9999A",
      name: null,
      details: null,
    });
  }

  // Simulate: PANs starting with TEST are rejected
  if (pan.startsWith("TEST")) {
    return res.json({
      verified: false,
      message: "PAN not found in Income Tax database",
      name: null,
      details: null,
    });
  }

  return res.json({
    verified: true,
    message: "PAN verified successfully with Income Tax Department",
    name: name ?? "Applicant",
    details: { pan, type: pan[3] === "P" ? "Individual" : "Business" },
  });
});

// POST /api/verify/aadhaar
router.post("/aadhaar", async (req, res) => {
  const parsed = VerifyAadhaarBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { aadhaar, otp } = parsed.data;
  const aadhaarRegex = /^\d{12}$/;

  await new Promise(r => setTimeout(r, 700));

  if (!aadhaarRegex.test(aadhaar)) {
    return res.json({
      verified: false,
      message: "Aadhaar must be exactly 12 digits",
      name: null,
      details: null,
    });
  }

  // If OTP not provided, this is a "Send OTP" request
  if (!otp) {
    return res.json({
      verified: false,
      message: "OTP sent to mobile number registered with Aadhaar",
      name: null,
      details: { otpSent: true },
    });
  }

  // Simulate OTP verification (any 6-digit OTP works in simulation)
  const otpRegex = /^\d{6}$/;
  if (!otpRegex.test(otp)) {
    return res.json({
      verified: false,
      message: "Invalid OTP. Please enter 6-digit OTP.",
      name: null,
      details: null,
    });
  }

  // Simulate: OTP "000000" always fails
  if (otp === "000000") {
    return res.json({
      verified: false,
      message: "OTP verification failed. Please try again.",
      name: null,
      details: null,
    });
  }

  return res.json({
    verified: true,
    message: "Aadhaar verified successfully via UIDAI",
    name: "Verified Applicant",
    details: { aadhaarLinked: true, maskedAadhaar: `XXXX XXXX ${aadhaar.slice(-4)}` },
  });
});

export default router;
