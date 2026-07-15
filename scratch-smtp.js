const nodemailer = require("nodemailer");

async function main() {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "larissaamca@gmail.com",
      pass: "wlpgaadhpjnvjykb"
    },
    logger: true,
    debug: true
  });

  try {
    await transporter.verify();
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
