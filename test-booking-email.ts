import * as dotenv from "dotenv";
dotenv.config({ path: "c:/Projects/taxfiling24/.env" });

import { sendAppointmentNotification } from "./lib/booking-notifications";

async function main() {
  console.log("Testing appointment confirmation notification...");
  try {
    const result = await sendAppointmentNotification({
      appointment: {
        bookingReference: "BK-TEST-20261108",
        date: new Date(),
        email: "mdray283@gmail.com",
        locationLabel: "Google Meet · https://meet.google.com/abc-defg-hij",
        locationType: "VIDEO",
        meetingLink: "https://meet.google.com/abc-defg-hij",
        message: "Tax filing consultation verification",
        name: "Md Rehan",
        service: "Income Tax Return (ITR) Consultation",
        time: "10:30",
      },
      type: "CONFIRMATION",
    });

    console.log("✓ Appointment email sent successfully! Result:", result);
  } catch (error) {
    console.error("✗ Failed to send appointment notification:", error);
  }
}

main();

