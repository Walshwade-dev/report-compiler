import { classifyFile } from "../lib/fileClassifier.ts";
import assert from "assert";

async function runTests() {
  console.log("Running file classifier tests...");

  // 1. By filename
  const dailyHour = new File(["dummy"], "daily_hour.csv");
  const res1 = await classifyFile(dailyHour);
  assert.strictEqual(res1.target, "daily_hour", "daily_hour filename test failed");

  const wideload = new File(["dummy"], "wideload.xlsx");
  const res2 = await classifyFile(wideload);
  assert.strictEqual(res2.target, "wideload", "wideload filename test failed");

  const prohibited = new File(["dummy"], "impounded_prohibited.csv");
  const res3 = await classifyFile(prohibited);
  assert.strictEqual(res3.target, "impounded_prohibited", "impounded_prohibited filename test failed");

  const overloaded = new File(["dummy"], "overloaded.csv");
  const res4 = await classifyFile(overloaded);
  assert.strictEqual(res4.target, "impounded_overloaded", "overloaded filename test failed");

  const transgression = new File(["dummy"], "TRANSGRESSION NAIROBI 06.09.2026.pdf");
  const res5 = await classifyFile(transgression);
  assert.strictEqual(res5.target, "transgression", "transgression filename test failed");

  const census = new File(["dummy"], "traffic_census_scan.png");
  const res6 = await classifyFile(census);
  assert.strictEqual(res6.target, "census", "census filename test failed");

  // 2. By content header sniffing (arbitrary filenames)
  const sniffDaily = new File(
    ["MultiDeck[D],SingleAxle[S],Manually[M],HSWIM Total[H],CalledIn[C]"],
    "unknown_file_1.csv"
  );
  const resSniff1 = await classifyFile(sniffDaily);
  assert.strictEqual(resSniff1.target, "daily_hour", "header sniff daily_hour failed");

  const sniffWideload = new File(
    ["Inspection Date,registration,Transp,Model,Origin,destination,Axleconf,Inspstick,InsuaranceStic,Cargo,Dpermitissu,Height,Length,Width,AbnormalLPermit"],
    "unknown_file_2.csv"
  );
  const resSniff2 = await classifyFile(sniffWideload);
  assert.strictEqual(resSniff2.target, "wideload", "header sniff wideload failed");

  const sniffProhibited = new File(
    ["DateWeighed,Transporter,VehicleReg,AxleConfig,Cargo,Source,Destination,AxleOverload,GVWOverload,ProhibitionOrder"],
    "unknown_file_3.csv"
  );
  const resSniff3 = await classifyFile(sniffProhibited);
  assert.strictEqual(resSniff3.target, "impounded_prohibited", "header sniff prohibited failed");

  const sniffOverloaded = new File(
    ["Vardict\nVehicle has a valid permit App-123"],
    "unknown_file_4.csv"
  );
  const resSniff4 = await classifyFile(sniffOverloaded);
  assert.strictEqual(resSniff4.target, "impounded_overloaded", "header sniff overloaded failed");

  console.log("All 10 file classifier test assertions passed successfully!");
}

runTests().catch((err) => {
  console.error("Classifier test failed:", err);
  process.exit(1);
});
