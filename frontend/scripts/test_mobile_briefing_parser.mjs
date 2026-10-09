import { parseMobileBriefing, applyBriefingToInputs } from "../lib/mobileBriefingParser.ts";
import assert from "assert";

console.log("Running mobile briefing parser tests...");

const sampleText = `Juja Mobile 2
Dated 08-10-2026

Mileage
Vehicle: KDS042Z
Start Mileage: 88,352   kms
Closing Mileage: 88, 590  kms 
Mileage covered:  238 kms

Weighed:31
Legal:11
Warned:0
Charged: 0
Offloaded:0
 
 Actual Route
Enzui-Ukasi-Nguni-Mwingi-Kanyonyo-Matuu-Kithimani-Thika-Juja

 Danka Personnel 
DM: George Mberia
Driver: Cyrus Ngángá

Police Officers
SGT Obilo
PC Edwin Kibiwott`;

const parsed = parseMobileBriefing(sampleText, { targetShift: "shift1" });

assert.strictEqual(parsed.station, "Juja mobile", "Station mismatch");
assert.strictEqual(parsed.bound, "Mobile 2", "Bound mismatch");
assert.strictEqual(parsed.reportDate, "2026-10-08", "Report date mismatch");
assert.strictEqual(parsed.mobileVehicleReg, "KDS042Z", "Vehicle reg mismatch");
assert.strictEqual(parsed.startMileage, "88352", "Start mileage mismatch");
assert.strictEqual(parsed.stopMileage, "88590", "Stop mileage mismatch");
assert.strictEqual(parsed.totalWeighed, 31, "Total weighed mismatch");
assert.strictEqual(parsed.transgressionsCount, "0", "Transgressions count mismatch");
assert.strictEqual(
  parsed.route,
  "ENZUI-UKASI-NGUNI-MWINGI-KANYONYO-MATUU-KITHIMANI-THIKA-JUJA",
  "Route mismatch"
);
assert.strictEqual(parsed.dmEntry, "George Mberia", "DM mismatch");
assert.strictEqual(parsed.driverEntry, "Cyrus Ngángá", "Driver mismatch");
assert.strictEqual(parsed.policeOfficerOne, "SGT Obilo", "Police 1 mismatch");
assert.strictEqual(parsed.policeOfficerTwo, "PC Edwin Kibiwott", "Police 2 mismatch");

console.log("✅ Sample text parsed successfully with all fields matching!");

// Test applying to inputs
const dummyInputs = {
  station: "",
  bound: "",
  reportDate: "",
  preparedBy: "User",
  approvedBy: "Faith",
  totalWeighed: 0,
  dmEntry: "",
  driverEntry: "",
  policeOfficerOne: "",
  policeOfficerTwo: "",
  shiftTwoDmEntry: "",
  shiftTwoDriverEntry: "",
  shiftTwoPoliceOfficerOne: "",
  shiftTwoPoliceOfficerTwo: "",
  route: "",
  mobileVehicleReg: "",
  startMileage: "",
  stopMileage: "",
  shiftTwoMobileVehicleReg: "",
  shiftTwoStartMileage: "",
  shiftTwoStopMileage: "",
  casesClearedInCourt: "0",
  transgressionsCount: "0",
  exemptedPermit: "0",
  manuallyWeighed: "0",
  vehicleCharges: [],
};

const applied = applyBriefingToInputs(dummyInputs, parsed);
assert.strictEqual(applied.station, "Juja mobile");
assert.strictEqual(applied.reportDate, "2026-10-08");
assert.strictEqual(applied.bound, "Mobile 2");
assert.strictEqual(applied.dmEntry, "George Mberia");
assert.strictEqual(applied.startMileage, "88352");
assert.strictEqual(applied.stopMileage, "88590");

console.log("✅ applyBriefingToInputs verified!");

// Test Shift 2 targeting
const parsedShift2 = parseMobileBriefing(sampleText, { targetShift: "shift2" });
assert.strictEqual(parsedShift2.shiftTwoMobileVehicleReg, "KDS042Z");
assert.strictEqual(parsedShift2.shiftTwoStartMileage, "88352");
assert.strictEqual(parsedShift2.shiftTwoStopMileage, "88590");
assert.strictEqual(parsedShift2.shiftTwoDmEntry, "George Mberia");
assert.strictEqual(parsedShift2.shiftTwoDriverEntry, "Cyrus Ngángá");
assert.strictEqual(parsedShift2.shiftTwoPoliceOfficerOne, "SGT Obilo");
assert.strictEqual(parsedShift2.shiftTwoPoliceOfficerTwo, "PC Edwin Kibiwott");

console.log("✅ Shift 2 targeting verified!");
console.log("All mobile briefing parser tests passed! 🎉");
