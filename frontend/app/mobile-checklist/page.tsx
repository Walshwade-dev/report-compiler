"use client";

import { useState, useEffect, useMemo } from "react";
import ReportsLayout from "../reports/layout";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  Plus,
  Download,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Wrench,
  Package,
  X,
  Scale
} from "lucide-react";
import {
  getMobileChecklistEntries,
  saveMobileChecklistEntry,
  approveMobileChecklistEntry,
  getEquipmentIssues,
  createEquipmentIssue,
  updateEquipmentIssueStatus,
  getDeliveryNotes,
  createDeliveryNote,
  getLoggedInUser
} from "@/lib/api";

const INITIAL_CHECKLIST_ITEMS = [
  { id: 1, name: "15-ton Wheel Load Scale (WL 108 Scale)", qty: "2", status: "Good", comments: "Clean & calibrated" },
  { id: 2, name: "Lockable Metallic Scale Casing", qty: "1", status: "Good", comments: "Locks intact" },
  { id: 3, name: "AC/DC Power Adapter for Scale", qty: "1", status: "Good", comments: "Wall charger ok" },
  { id: 4, name: "5m load scale connecting Cable (E Cable 6920.2)", qty: "1", status: "Good", comments: "Cable intact" },
  { id: 5, name: "10m load scale Connecting Cable (E Cable 6920.3)", qty: "1", status: "Good", comments: "Pins checked" },
  { id: 6, name: "Terminating Plug / Connector (E 6919.0)", qty: "2", status: "Good", comments: "OK" },
  { id: 7, name: "PC Interface with Wireless Option (E 9023.1)", qty: "1", status: "Good", comments: "Wireless signal good" },
  { id: 8, name: "Levelling Mats (0.8m x 0.9m x 17mm) (D 12535.0)", qty: "4", status: "Good", comments: "No cracks" },
  { id: 9, name: "Reflective Traffic Cones", qty: "6", status: "Good", comments: "Reflectors clean" },
  { id: 10, name: "5M Bosch Telescopic Survey Levelling Staff", qty: "1", status: "Good", comments: "Locking mechanism smooth" },
  { id: 11, name: "50M Steel Tape Measure", qty: "1", status: "Good", comments: "OK" },
  { id: 12, name: "Laptop and Charger", qty: "1", status: "Good", comments: "Fully charged" },
  { id: 13, name: "Bag to Carry Laptop & Accessories", qty: "1", status: "Good", comments: "OK" },
  { id: 14, name: "Printer", qty: "1", status: "Good", comments: "Paper cartridge loaded" },
  { id: 15, name: "Digital Camera", qty: "1", status: "Good", comments: "SD card formatted" },
  { id: 16, name: "Mobile Phone", qty: "1", status: "Good", comments: "Credit & battery ok" },
  { id: 17, name: "12Vdc to 240Vac Power Inverter & Torches", qty: "1 Inverter / 2 Torches", status: "Good", comments: "Tested" },
  { id: 18, name: "Casio Calculator", qty: "1", status: "Good", comments: "OK" },
  { id: 19, name: "Certificate of Compliance Book", qty: "1", status: "Good", comments: "In vehicle" },
  { id: 20, name: "Prohibition Order Book", qty: "1", status: "Good", comments: "In vehicle" },
  { id: 21, name: "Notice to Attend Court (NTAC)", qty: "1 Book", status: "Good", comments: "In vehicle" },
  { id: 22, name: "Certificates of Verification (Scales, Staff & Tape)", qty: "Set", status: "Good", comments: "Valid till Jan 2027" },
  { id: 23, name: "Umbrella(s)", qty: "2", status: "Good", comments: "OK" },
  { id: 24, name: "Adjustable Spanner", qty: "1", status: "Good", comments: "Tool kit" },
  { id: 25, name: "Hacksaw", qty: "1", status: "Good", comments: "Tool kit" },
  { id: 26, name: "Claw Hammer", qty: "1", status: "Good", comments: "Tool kit" },
  { id: 27, name: "Combined Spanner Size 10,12,13,14", qty: "1 Each", status: "Good", comments: "Tool kit" },
  { id: 28, name: "T-Socket Spanner Size 10,12,13,14", qty: "1 Each", status: "Good", comments: "Tool kit" },
  { id: 29, name: "Combination Pliers", qty: "1", status: "Good", comments: "Tool kit" },
  { id: 30, name: "Screwdriver (Flat & Phillips head)", qty: "1 Each", status: "Good", comments: "Tool kit" },
  { id: 31, name: "Roadblock Spikes", qty: "2", status: "Good", comments: "Security ok" },
  { id: 32, name: "Hand Broom", qty: "1", status: "Good", comments: "Cleanliness kit" },
  { id: 33, name: "Vehicle Telematics (Confirm lights on)", qty: "3 Lights", status: "Good", comments: "GPS active" },
];

export default function MobileChecklistPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"inspection" | "archive" | "issues" | "deliveries">("inspection");
  
  // Inspection Form State
  const [shift, setShift] = useState<"Day Shift Mobile Operations" | "Night Shift Mobile Operations">("Day Shift Mobile Operations");
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [stationName, setStationName] = useState("Mobile 1 Weighbridge");
  const [scalesSno, setScalesSno] = useState("6451");
  const [vehicleReg, setVehicleReg] = useState("KCM 494U / KCF 951Q");
  const [technicianName, setTechnicianName] = useState("");
  
  const [checklistItems, setChecklistItems] = useState(INITIAL_CHECKLIST_ITEMS);
  const [mobileScaleGvw, setMobileScaleGvw] = useState<number | "">(12440);
  const [multideckScaleGvw, setMultideckScaleGvw] = useState<number | "">(11960);
  
  // Technical checks
  const [plateScrewsTight, setPlateScrewsTight] = useState(true);
  const [surfaceClean, setSurfaceClean] = useState(true);
  const [batteryCharge, setBatteryCharge] = useState(95);
  const [dryOperation, setDryOperation] = useState(true);
  const [cablesIntact, setCablesIntact] = useState(true);

  // Data lists
  const [entries, setEntries] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue modal state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [newIssueEquipment, setNewIssueEquipment] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [newIssueHandler, setNewIssueHandler] = useState("");
  const [newIssueSeverity, setNewIssueSeverity] = useState("Medium");
  
  // Delivery note modal state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [newDelItem, setNewDelItem] = useState("");
  const [newDelSerial, setNewDelSerial] = useState("");
  const [newDelCondition, setNewDelCondition] = useState("Brand New - Calibrated");
  const [newDelPurpose, setNewDelPurpose] = useState("Mobile Operations Primary Equipment");
  const [newDelBy, setNewDelBy] = useState("");
  const [newDelReceivedBy, setNewDelReceivedBy] = useState("");

  useEffect(() => {
    const loggedUser = getLoggedInUser();
    setUser(loggedUser);
    if (loggedUser) {
      setTechnicianName(loggedUser.username || loggedUser.role);
    }

    async function loadData() {
      try {
        setLoading(true);
        const [entriesRes, issuesRes, delRes] = await Promise.all([
          getMobileChecklistEntries(),
          getEquipmentIssues(),
          getDeliveryNotes()
        ]);
        setEntries(entriesRes.entries || []);
        setIssues(issuesRes.issues || []);
        setDeliveryNotes(delRes.notes || []);
      } catch (err) {
        console.error("Failed to load mobile checklist data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Calculated Variance
  const calculatedVariance = useMemo(() => {
    const mob = typeof mobileScaleGvw === "number" ? mobileScaleGvw : 0;
    const multi = typeof multideckScaleGvw === "number" ? multideckScaleGvw : 0;
    return Math.abs(mob - multi);
  }, [mobileScaleGvw, multideckScaleGvw]);

  const varianceComment = useMemo(() => {
    if (calculatedVariance <= 200) {
      return `Variance of ${calculatedVariance}kg is within acceptable calibration tolerance (<= 200kg).`;
    }
    return `ALERT: Scale weight variance of ${calculatedVariance}kg exceeds 200kg threshold. Recalibration and technical inspection recommended.`;
  }, [calculatedVariance]);

  const handleItemStatusChange = (id: number, newStatus: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleItemCommentChange = (id: number, newComment: string) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comments: newComment } : item))
    );
  };

  const handleSaveChecklist = async () => {
    const payload = {
      date: reportDate,
      shift,
      station: stationName,
      scales_sno: scalesSno,
      technician_name: technicianName || "Technician",
      mobile_scale_gvw: Number(mobileScaleGvw) || 0,
      multideck_scale_gvw: Number(multideckScaleGvw) || 0,
      variance_gvw: calculatedVariance,
      variance_comment: varianceComment,
      items: checklistItems,
      technical_checks: {
        plate_screws_tight: plateScrewsTight,
        surface_clean: surfaceClean,
        battery_charge: batteryCharge,
        dry_operation: dryOperation,
        cables_intact: cablesIntact
      },
      vehicle_reg: vehicleReg
    };

    const res = await saveMobileChecklistEntry(payload);
    if (res.entry) {
      setEntries((prev) => [res.entry, ...prev]);
      alert("Mobile operations checklist saved successfully!");
    }
  };

  const handleApproveEntry = async (entryId: string) => {
    const approverName = user?.username ? `${user.username} (${user.role})` : "Duty Manager";
    const res = await approveMobileChecklistEntry(entryId, approverName);
    setEntries((prev) =>
      prev.map((item) =>
        item.id === entryId ? { ...item, status: "Approved", approved_by: approverName } : item
      )
    );
    alert("Checklist approved and compressed archive created!");
  };

  const handleCreateIssue = async () => {
    if (!newIssueEquipment || !newIssueDesc) {
      alert("Please fill in equipment name and issue description.");
      return;
    }
    const payload = {
      equipment_name: newIssueEquipment,
      issue_description: newIssueDesc,
      reported_date: reportDate,
      reported_by: user?.username || "Duty Manager",
      status: "Pending",
      severity: newIssueSeverity,
      assigned_handler: newIssueHandler || "Unassigned",
      resolution_notes: ""
    };

    const res = await createEquipmentIssue(payload);
    if (res.issue) {
      setIssues((prev) => [res.issue, ...prev]);
      setIsIssueModalOpen(false);
      setNewIssueEquipment("");
      setNewIssueDesc("");
      setNewIssueHandler("");
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, newStatus: string, resolutionNotes?: string) => {
    await updateEquipmentIssueStatus(issueId, { status: newStatus, resolution_notes: resolutionNotes });
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId
          ? { ...item, status: newStatus, resolution_notes: resolutionNotes || item.resolution_notes }
          : item
      )
    );
  };

  const handleCreateDeliveryNote = async () => {
    if (!newDelItem || !newDelBy) {
      alert("Please fill in item name and delivered by fields.");
      return;
    }
    const payload = {
      delivery_date: reportDate,
      item_name: newDelItem,
      serial_numbers: newDelSerial || "N/A",
      condition_state: newDelCondition,
      intended_purpose: newDelPurpose,
      delivered_by: newDelBy,
      received_by: newDelReceivedBy || user?.username || "Technical Officer",
      pdf_url: "#"
    };

    const res = await createDeliveryNote(payload);
    if (res.note) {
      setDeliveryNotes((prev) => [res.note, ...prev]);
      setIsDeliveryModalOpen(false);
      setNewDelItem("");
      setNewDelBy("");
    }
  };

  const isDutyManagerOrAdmin =
    user?.role === "admin" ||
    user?.role === "developer" ||
    user?.role === "duty_manager" ||
    user?.role === "viewer_duty_manager";

  return (
    <ReportsLayout>
      <div className="space-y-6">
        {/* Workspace Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#0c2e4e] via-[#0b253f] to-[#071827] p-6 shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
                  <ClipboardCheck size={12} className="animate-pulse" /> Doc Ref: DNK/AFRKE/LV3/WBS/018/FM03
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
                  Revision 01
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
                Mobile Operations Equipment Checklist Workspace
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Daily shift checklist verification, scale calibration variance analysis, maintenance issue tracking, and delivery note archiving.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-cyan-950/50 border border-cyan-900/60 p-3">
                <User size={18} className="text-cyan-400" />
                <div>
                  <p className="text-xs font-bold text-white">{user?.username || "Authorized User"}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Role: {user?.role || "Viewer"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#071827] p-1.5 border border-cyan-900/40">
          <button
            onClick={() => setActiveTab("inspection")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "inspection"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ClipboardCheck size={16} />
            Technician Shift Inspection
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "archive"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={16} />
            Approved Monthly Archive ({entries.length})
          </button>

          <button
            onClick={() => setActiveTab("issues")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "issues"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Wrench size={16} />
            Equipment Issues Log ({issues.filter(i => i.status !== "Resolved").length} Pending)
          </button>

          <button
            onClick={() => setActiveTab("deliveries")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "deliveries"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Package size={16} />
            Scale Equipment Delivery Notes ({deliveryNotes.length})
          </button>
        </div>

        {/* TAB 1: TECHNICIAN INSPECTION FORM */}
        {activeTab === "inspection" && (
          <div className="space-y-6">
            {/* Shift & Metadata Config Card */}
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-cyan-950 pb-3">
                <Calendar size={18} className="text-cyan-400" />
                Shift Parameters & Station Metadata
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Shift Operations</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full rounded-lg border border-cyan-800 bg-[#071827] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                  >
                    <option value="Day Shift Mobile Operations">Day Shift Mobile Operations</option>
                    <option value="Night Shift Mobile Operations">Night Shift Mobile Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Inspection Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full rounded-lg border border-cyan-800 bg-[#071827] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Station Scope</label>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full rounded-lg border border-cyan-800 bg-[#071827] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Scales Serial No.</label>
                  <input
                    type="text"
                    value={scalesSno}
                    onChange={(e) => setScalesSno(e.target.value)}
                    className="w-full rounded-lg border border-cyan-800 bg-[#071827] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Scale Calibration Variance Engine Card */}
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-3 mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale size={18} className="text-cyan-400" />
                  Scale Calibration Verification (GVW Multi-Deck vs. Mobile)
                </h2>
                <span className="text-xs text-slate-400">Vehicle Reg: {vehicleReg}</span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Mobile Scale GVW (Kgs)</label>
                  <input
                    type="number"
                    value={mobileScaleGvw}
                    onChange={(e) => setMobileScaleGvw(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-lg border border-cyan-800 bg-[#071827] px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Multi-Deck Scale GVW (Kgs)</label>
                  <input
                    type="number"
                    value={multideckScaleGvw}
                    onChange={(e) => setMultideckScaleGvw(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-lg border border-cyan-800 bg-[#071827] px-3 py-2 text-sm text-indigo-300 font-mono font-bold focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">GVW Variance (Kgs)</label>
                  <div className={`rounded-lg border px-3 py-2 text-sm font-mono font-bold ${
                    calculatedVariance <= 200
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                      : "border-rose-500/50 bg-rose-950/30 text-rose-300"
                  }`}>
                    {calculatedVariance.toLocaleString()} Kgs
                  </div>
                </div>
              </div>

              {/* Automated Variance Comment */}
              <div className={`mt-4 rounded-xl border p-4 ${
                calculatedVariance <= 200
                  ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-200"
                  : "border-rose-500/30 bg-rose-950/20 text-rose-200"
              }`}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  {calculatedVariance <= 200 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  System Automated Calibration Analysis
                </p>
                <p className="text-sm font-medium">{varianceComment}</p>
              </div>
            </div>

            {/* Technical Rule Checkpoints */}
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4 border-b border-cyan-950 pb-3">
                <ShieldCheck size={18} className="text-cyan-400" />
                Outgoing Duty Manager / Technical Officer Rules Checklist
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex items-center gap-3 rounded-lg border border-cyan-900/60 bg-[#071827] p-3 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={plateScrewsTight}
                    onChange={(e) => setPlateScrewsTight(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-700 bg-cyan-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">Digital Mobile Plate & Handle Screws Tight & Intact</span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-cyan-900/60 bg-[#071827] p-3 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={surfaceClean}
                    onChange={(e) => setSurfaceClean(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-700 bg-cyan-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">Plates Clean from Accumulated Dirt</span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-cyan-900/60 bg-[#071827] p-3 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={batteryCharge >= 20}
                    onChange={(e) => setBatteryCharge(e.target.checked ? 95 : 10)}
                    className="h-4 w-4 rounded border-cyan-700 bg-cyan-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">Plates Charged (&#8805; 20% Minimum Charge)</span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-cyan-900/60 bg-[#071827] p-3 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={dryOperation}
                    onChange={(e) => setDryOperation(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-700 bg-cyan-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">WL 108 Scales Not Operated Under Water</span>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-cyan-900/60 bg-[#071827] p-3 cursor-pointer hover:border-cyan-500/40">
                  <input
                    type="checkbox"
                    checked={cablesIntact}
                    onChange={(e) => setCablesIntact(e.target.checked)}
                    className="h-4 w-4 rounded border-cyan-700 bg-cyan-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">Both Connecting Cables Tested & Good</span>
                </label>
              </div>
            </div>

            {/* 33 Equipment Items Checklist Table */}
            <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Equipment Inspection Inventory (33 Items)</h2>
                  <p className="text-xs text-slate-400">Verify state and quantity of each mobile operational tool before deployment.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveChecklist}
                    className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
                  >
                    <ClipboardCheck size={16} />
                    Save Shift Entry
                  </button>

                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-cyan-700 bg-cyan-950/50 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    <Download size={16} />
                    Download PDF Form
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-cyan-900/50 bg-[#071827] text-[11px] font-bold uppercase text-slate-400">
                      <th className="py-3 px-3 w-12">#</th>
                      <th className="py-3 px-3">Item Description</th>
                      <th className="py-3 px-3 w-28">Quantity</th>
                      <th className="py-3 px-3 w-36">Status</th>
                      <th className="py-3 px-3">Comments / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-900/30">
                    {checklistItems.map((item) => (
                      <tr key={item.id} className="hover:bg-cyan-950/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{item.id}</td>
                        <td className="py-2.5 px-3 font-medium text-white">{item.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{item.qty}</td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.status}
                            onChange={(e) => handleItemStatusChange(item.id, e.target.value)}
                            className={`rounded-lg border px-2 py-1 text-xs font-bold outline-none cursor-pointer ${
                              item.status === "Good"
                                ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                                : item.status === "Faulty"
                                ? "border-rose-500/40 bg-rose-950/30 text-rose-300"
                                : "border-slate-700 bg-slate-900 text-slate-400"
                            }`}
                          >
                            <option value="Good">Good / OK</option>
                            <option value="Faulty">Faulty</option>
                            <option value="Needs Maintenance">Needs Maint</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.comments}
                            onChange={(e) => handleItemCommentChange(item.id, e.target.value)}
                            className="w-full rounded border border-cyan-900/60 bg-[#071827] px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPROVED MONTHLY ARCHIVE */}
        {activeTab === "archive" && (
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="text-cyan-400" size={18} />
                  Approved Shift Checklists Archive (Active Month Rolling Retention)
                </h2>
                <p className="text-xs text-slate-400">
                  Compressed and verified checklists for Day & Night shift operations. Automatically retains current month entries.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-cyan-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 bg-[#071827]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">Station & Scale S/No</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Scale Variance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/30">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">No shift checklist entries found on record.</td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-cyan-950/20 transition-colors">
                        <td className="py-4 px-4 font-mono text-xs font-semibold text-white">{entry.date}</td>
                        <td className="py-4 px-4 text-xs font-bold text-cyan-300">{entry.shift}</td>
                        <td className="py-4 px-4 text-xs text-slate-400">{entry.station} (S/N {entry.scales_sno})</td>
                        <td className="py-4 px-4 text-xs text-slate-300">{entry.technician_name}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            entry.variance_gvw <= 200
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                          }`}>
                            {entry.variance_gvw} Kgs
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                            entry.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          }`}>
                            {entry.status === "Approved" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {entry.status !== "Approved" && isDutyManagerOrAdmin && (
                              <button
                                onClick={() => handleApproveEntry(entry.id)}
                                className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              onClick={() => alert(`Inspection Details:\n- Date: ${entry.date}\n- Shift: ${entry.shift}\n- Variance: ${entry.variance_gvw}kg\n- Comment: ${entry.variance_comment}`)}
                              className="inline-flex items-center gap-1 rounded border border-cyan-700 bg-cyan-950/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                            >
                              View PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EQUIPMENT ISSUES LOG */}
        {activeTab === "issues" && (
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench className="text-cyan-400" size={18} />
                  Equipment Operational Maintenance & Fault Log
                </h2>
                <p className="text-xs text-slate-400">Track equipment issues arising during mobile operations, assigned handlers, and resolution status.</p>
              </div>

              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
              >
                <Plus size={16} />
                Log Equipment Issue
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-cyan-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 bg-[#071827]">
                    <th className="py-3 px-4">Equipment</th>
                    <th className="py-3 px-4">Issue Description</th>
                    <th className="py-3 px-4">Reported</th>
                    <th className="py-3 px-4">Assigned Handler</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/30">
                  {issues.map((iss) => (
                    <tr key={iss.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-4 px-4 font-bold text-white text-xs">{iss.equipment_name}</td>
                      <td className="py-4 px-4 text-xs text-slate-300 max-w-xs">{iss.issue_description}</td>
                      <td className="py-4 px-4 text-xs font-mono text-slate-400">{iss.reported_date} by {iss.reported_by}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-cyan-300">{iss.assigned_handler}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                          iss.status === "Resolved"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                            : iss.status === "In Progress"
                            ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}>
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {iss.status !== "Resolved" && (
                          <button
                            onClick={() => {
                              const notes = prompt("Enter resolution notes:", "Repaired and tested on bench.");
                              if (notes) handleUpdateIssueStatus(iss.id, "Resolved", notes);
                            }}
                            className="rounded bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERY NOTES */}
        {activeTab === "deliveries" && (
          <div className="rounded-xl border border-cyan-900/50 bg-[#0b2135]/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="text-cyan-400" size={18} />
                  Mobile Scale Equipment Delivery Notes Subsection
                </h2>
                <p className="text-xs text-slate-400">Delivery records, equipment condition upon delivery, intended purpose, and viewable PDF attachments.</p>
              </div>

              <button
                onClick={() => setIsDeliveryModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition"
              >
                <Plus size={16} />
                Add Delivery Note
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-cyan-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 bg-[#071827]">
                    <th className="py-3 px-4">Delivery Date</th>
                    <th className="py-3 px-4">Item Delivered</th>
                    <th className="py-3 px-4">Serial Numbers</th>
                    <th className="py-3 px-4">State / Condition</th>
                    <th className="py-3 px-4">Intended Purpose</th>
                    <th className="py-3 px-4">Sign-offs</th>
                    <th className="py-3 px-4 text-right">PDF Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-900/30">
                  {deliveryNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-white">{note.delivery_date}</td>
                      <td className="py-4 px-4 font-bold text-cyan-200 text-xs">{note.item_name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">{note.serial_numbers}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-emerald-300">{note.condition_state}</td>
                      <td className="py-4 px-4 text-xs text-slate-300 max-w-xs">{note.intended_purpose}</td>
                      <td className="py-4 px-4 text-xs text-slate-400">By: {note.delivered_by} | Rec: {note.received_by}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => alert(`Delivery Note PDF:\nItem: ${note.item_name}\nDate: ${note.delivery_date}\nCondition: ${note.condition_state}`)}
                          className="inline-flex items-center gap-1 rounded border border-cyan-700 bg-cyan-950/40 px-2.5 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                        >
                          <FileText size={14} /> View Note PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: LOG EQUIPMENT ISSUE */}
        {isIssueModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-cyan-800 bg-[#071827] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
                <h3 className="text-base font-bold text-white">Log Equipment Fault / Maintenance</h3>
                <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Equipment Name</label>
                <input
                  type="text"
                  placeholder="e.g. 5m load scale connecting Cable"
                  value={newIssueEquipment}
                  onChange={(e) => setNewIssueEquipment(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Issue Description</label>
                <textarea
                  placeholder="Describe fault or maintenance requirement..."
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Assigned Handler / Technician</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Technical Officer"
                  value={newIssueHandler}
                  onChange={(e) => setNewIssueHandler(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-cyan-950">
                <button
                  onClick={() => setIsIssueModalOpen(false)}
                  className="rounded-lg border border-cyan-900 bg-[#0b2135] px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateIssue}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Save Equipment Issue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD DELIVERY NOTE */}
        {isDeliveryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-cyan-800 bg-[#071827] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-950 pb-3">
                <h3 className="text-base font-bold text-white">Add Mobile Equipment Delivery Note</h3>
                <button onClick={() => setIsDeliveryModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Item Delivered</label>
                <input
                  type="text"
                  placeholder="e.g. WL 108 Wheel Load Scale 15-Ton"
                  value={newDelItem}
                  onChange={(e) => setNewDelItem(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Serial Numbers</label>
                <input
                  type="text"
                  placeholder="e.g. 6451-A, 6451-B"
                  value={newDelSerial}
                  onChange={(e) => setNewDelSerial(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Condition / State</label>
                <input
                  type="text"
                  value={newDelCondition}
                  onChange={(e) => setNewDelCondition(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Delivered By</label>
                <input
                  type="text"
                  placeholder="e.g. Avery Weights Kenya Ltd"
                  value={newDelBy}
                  onChange={(e) => setNewDelBy(e.target.value)}
                  className="w-full rounded-lg border border-cyan-800 bg-[#0b2135] px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-cyan-950">
                <button
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="rounded-lg border border-cyan-900 bg-[#0b2135] px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeliveryNote}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Create Delivery Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReportsLayout>
  );
}
