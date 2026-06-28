/**
 * data.js — appliance database + watt presets.
 *
 * Each device carries a bilingual name (en + bn) and a typical wattage.
 * Wattage is NOT shown as a "category" on the device item itself — it only
 * auto-fills the separate Watt combobox, where the user can override it.
 *
 * Exposed on window.ECData so plain <script> tags can share it (no bundler).
 */
(function () {
  "use strict";

  // Category keys map into i18n (STR.categories[key]). Keep keys stable.
  const CATEGORIES = [
    "kitchen",
    "cooling",
    "lighting",
    "fans",
    "entertainment",
    "laundry",
    "personalCare",
    "charging",
    "water",
    "building",
    "other",
  ];

  // name = English, bn = Bangla, watts = typical wattage (W).
  const DEVICES = [
    // Kitchen
    { cat: "kitchen", name: "Refrigerator", bn: "ফ্রিজ", watts: 150 },
    { cat: "kitchen", name: "Inverter Refrigerator", bn: "ইনভার্টার ফ্রিজ", watts: 100 },
    { cat: "kitchen", name: "Double-door Fridge / Freezer", bn: "ডাবল-ডোর ফ্রিজ / ফ্রিজার", watts: 200 },
    { cat: "kitchen", name: "Inverter Double-door Fridge / Freezer", bn: "ইনভার্টার ডাবল-ডোর ফ্রিজ / ফ্রিজার", watts: 120 },
    { cat: "kitchen", name: "Microwave Oven", bn: "মাইক্রোওয়েভ ওভেন", watts: 1200 },
    { cat: "kitchen", name: "Electric Oven", bn: "ইলেকট্রিক ওভেন", watts: 2000 },
    { cat: "kitchen", name: "Rice Cooker", bn: "রাইস কুকার", watts: 700 },
    { cat: "kitchen", name: "Induction Cooktop", bn: "ইনডাকশন চুলা", watts: 2000 },
    { cat: "kitchen", name: "Electric Kettle", bn: "ইলেকট্রিক কেটলি", watts: 1500 },
    { cat: "kitchen", name: "Blender / Grinder", bn: "ব্লেন্ডার / গ্রাইন্ডার", watts: 400 },
    { cat: "kitchen", name: "Toaster", bn: "টোস্টার", watts: 800 },
    { cat: "kitchen", name: "Coffee Maker", bn: "কফি মেকার", watts: 800 },
    { cat: "kitchen", name: "Dishwasher", bn: "ডিশওয়াশার", watts: 1500 },
    { cat: "kitchen", name: "Water Purifier", bn: "ওয়াটার পিউরিফায়ার", watts: 50 },
    { cat: "kitchen", name: "RO Water Purifier / Filter", bn: "আরও ওয়াটার পিউরিফায়ার / ফিল্টার", watts: 75 },
    { cat: "kitchen", name: "Electric Water Dispenser (Hot & Cold)", bn: "ইলেকট্রিক ওয়াটার ডিসপেন্সার (গরম ও ঠান্ডা)", watts: 500 },
    { cat: "kitchen", name: "Electric Pressure Cooker", bn: "ইলেকট্রিক প্রেশার কুকার", watts: 1000 },
    { cat: "kitchen", name: "Deep Fryer", bn: "ডিপ ফ্রায়ার", watts: 2000 },
    { cat: "kitchen", name: "Sandwich Maker / Panini Press", bn: "স্যান্ডউইচ মেকার / প্যানিনি প্রেস", watts: 750 },

    // Cooling & Heating
    { cat: "cooling", name: "Air Conditioner (1 ton)", bn: "এয়ার কন্ডিশনার (১ টন)", watts: 1000 },
    { cat: "cooling", name: "Air Conditioner (1.5 ton)", bn: "এয়ার কন্ডিশনার (১.৫ টন)", watts: 1500 },
    { cat: "cooling", name: "Air Conditioner (2 ton)", bn: "এয়ার কন্ডিশনার (২ টন)", watts: 2000 },
    { cat: "cooling", name: "Air Cooler", bn: "এয়ার কুলার", watts: 200 },
    { cat: "cooling", name: "Room Heater", bn: "রুম হিটার", watts: 1500 },
    { cat: "cooling", name: "Water Heater / Geyser", bn: "ওয়াটার হিটার / গিজার", watts: 2000 },
    { cat: "cooling", name: "Dehumidifier", bn: "ডিহিউমিডিফায়ার", watts: 300 },

    // Lighting
    { cat: "lighting", name: "LED Bulb", bn: "এলইডি বাল্ব", watts: 9 },
    { cat: "lighting", name: "CFL Bulb", bn: "সিএফএল বাল্ব", watts: 20 },
    { cat: "lighting", name: "LED Tube Light", bn: "এলইডি টিউব লাইট", watts: 18 },
    { cat: "lighting", name: "Fluorescent Tube Light", bn: "ফ্লুরোসেন্ট টিউব লাইট", watts: 40 },
    { cat: "lighting", name: "Incandescent Bulb", bn: "ইনক্যান্ডিসেন্ট বাল্ব", watts: 60 },
    { cat: "lighting", name: "Night Lamp", bn: "নাইট ল্যাম্প", watts: 5 },
    { cat: "lighting", name: "Flood Light", bn: "ফ্লাড লাইট", watts: 50 },
    { cat: "lighting", name: "Decorative Lights", bn: "ডেকোরেটিভ লাইট", watts: 25 },

    // Fans
    { cat: "fans", name: "Ceiling Fan", bn: "সিলিং ফ্যান", watts: 75 },
    { cat: "fans", name: "Table Fan", bn: "টেবিল ফ্যান", watts: 50 },
    { cat: "fans", name: "Stand Fan", bn: "স্ট্যান্ড ফ্যান", watts: 60 },
    { cat: "fans", name: "Wall Fan", bn: "ওয়াল ফ্যান", watts: 55 },
    { cat: "fans", name: "Exhaust Fan", bn: "এক্সহস্ট ফ্যান", watts: 40 },
    { cat: "fans", name: "Rechargeable Fan", bn: "রিচার্জেবল ফ্যান", watts: 30 },

    // Entertainment
    { cat: "entertainment", name: 'LED TV (32")', bn: "এলইডি টিভি (৩২ ইঞ্চি)", watts: 50 },
    { cat: "entertainment", name: 'LED TV (43")', bn: "এলইডি টিভি (৪৩ ইঞ্চি)", watts: 80 },
    { cat: "entertainment", name: 'LED TV (55")', bn: "এলইডি টিভি (৫৫ ইঞ্চি)", watts: 120 },
    { cat: "entertainment", name: "Sound System", bn: "সাউন্ড সিস্টেম", watts: 80 },
    { cat: "entertainment", name: "Gaming Console", bn: "গেমিং কনসোল", watts: 150 },
    { cat: "entertainment", name: "Set-top Box", bn: "সেট-টপ বক্স", watts: 15 },
    { cat: "entertainment", name: "Projector", bn: "প্রজেক্টর", watts: 250 },

    // Laundry
    { cat: "laundry", name: "Washing Machine", bn: "ওয়াশিং মেশিন", watts: 500 },
    { cat: "laundry", name: "Washing Machine (with heater)", bn: "ওয়াশিং মেশিন (হিটারসহ)", watts: 2000 },
    { cat: "laundry", name: "Clothes Dryer", bn: "ক্লথস ড্রায়ার", watts: 2500 },
    { cat: "laundry", name: "Iron", bn: "ইস্ত্রি", watts: 1100 },
    { cat: "laundry", name: "Steam Iron", bn: "স্টিম ইস্ত্রি", watts: 1500 },

    // Personal Care
    { cat: "personalCare", name: "Hair Dryer", bn: "হেয়ার ড্রায়ার", watts: 1200 },
    { cat: "personalCare", name: "Hair Straightener", bn: "হেয়ার স্ট্রেইটনার", watts: 60 },
    { cat: "personalCare", name: "Trimmer", bn: "ট্রিমার", watts: 10 },
    { cat: "personalCare", name: "Electric Shaver", bn: "ইলেকট্রিক শেভার", watts: 15 },

    // Charging & Computing
    { cat: "charging", name: "Mobile Charger", bn: "মোবাইল চার্জার", watts: 10 },
    { cat: "charging", name: "Laptop", bn: "ল্যাপটপ", watts: 65 },
    { cat: "charging", name: "Desktop Computer", bn: "ডেস্কটপ কম্পিউটার", watts: 200 },
    { cat: "charging", name: "Monitor", bn: "মনিটর", watts: 30 },
    { cat: "charging", name: "Tablet Charger", bn: "ট্যাবলেট চার্জার", watts: 18 },
    { cat: "charging", name: "Wi-Fi Router", bn: "ওয়াই-ফাই রাউটার", watts: 10 },
    { cat: "charging", name: "Printer", bn: "প্রিন্টার", watts: 50 },

    // Water & Pump
    { cat: "water", name: "Water Pump (0.5 HP)", bn: "ওয়াটার পাম্প (০.৫ এইচপি)", watts: 375 },
    { cat: "water", name: "Water Pump (1 HP)", bn: "ওয়াটার পাম্প (১ এইচপি)", watts: 750 },
    { cat: "water", name: "Submersible Pump", bn: "সাবমার্সিবল পাম্প", watts: 1100 },
    { cat: "water", name: "Instant Water Heater (Shower)", bn: "ইনস্ট্যান্ট ওয়াটার হিটার (শাওয়ার)", watts: 3000 },
    { cat: "water", name: "Aquarium Pump", bn: "অ্যাকোয়ারিয়াম পাম্প", watts: 20 },

    // Building & Common Areas
    { cat: "building", name: "Lift / Elevator (6-person)", bn: "লিফট / এলিভেটর (৬ জন)", watts: 5000 },
    { cat: "building", name: "Lift / Elevator (8-person)", bn: "লিফট / এলিভেটর (৮ জন)", watts: 7500 },
    { cat: "building", name: "Lift / Elevator (10-person / commercial)", bn: "লিফট / এলিভেটর (১০ জন / বাণিজ্যিক)", watts: 10000 },
    { cat: "building", name: "Corridor / Stairwell LED Light", bn: "করিডোর / সিঁড়ির এলইডি লাইট", watts: 18 },
    { cat: "building", name: "Lobby / Reception Light", bn: "লবি / রিসেপশন লাইট", watts: 50 },
    { cat: "building", name: "Common Area Ceiling Fan", bn: "কমন এরিয়া সিলিং ফ্যান", watts: 75 },
    { cat: "building", name: "Common Area Exhaust Fan", bn: "কমন এরিয়া এক্সহস্ট ফ্যান", watts: 40 },
    { cat: "building", name: "Water Motor (2 HP)", bn: "ওয়াটার মোটর (২ এইচপি)", watts: 1500 },
    { cat: "building", name: "Water Motor (3 HP)", bn: "ওয়াটার মোটর (৩ এইচপি)", watts: 2238 },
    { cat: "building", name: "Water Motor (5 HP)", bn: "ওয়াটার মোটর (৫ এইচপি)", watts: 3730 },
    { cat: "building", name: "Rooftop / Overhead Tank Pump", bn: "ছাদের ট্যাংকের পাম্প", watts: 750 },
    { cat: "building", name: "CCTV / NVR System (4 cameras)", bn: "সিসিটিভি / এনভিআর সিস্টেম (৪ ক্যামেরা)", watts: 80 },
    { cat: "building", name: "CCTV / NVR System (8 cameras)", bn: "সিসিটিভি / এনভিআর সিস্টেম (৮ ক্যামেরা)", watts: 120 },
    { cat: "building", name: "Electric Gate Motor", bn: "ইলেকট্রিক গেট মোটর", watts: 200 },
    { cat: "building", name: "Building Intercom System", bn: "বিল্ডিং ইন্টারকম সিস্টেম", watts: 30 },
    { cat: "building", name: "Generator / DG Set (standby panel)", bn: "জেনারেটর / ডিজি সেট (স্ট্যান্ডবাই প্যানেল)", watts: 500 },
    { cat: "building", name: "Common Area AC (2 ton)", bn: "কমন এরিয়া এসি (২ টন)", watts: 2000 },
    { cat: "building", name: "Fire Alarm System Panel", bn: "ফায়ার অ্যালার্ম সিস্টেম প্যানেল", watts: 50 },
    { cat: "building", name: "Electric Door Lock / Access Control", bn: "ইলেকট্রিক ডোর লক / অ্যাক্সেস কন্ট্রোল", watts: 20 },
    { cat: "building", name: "Building WiFi Access Point", bn: "বিল্ডিং ওয়াই-ফাই অ্যাক্সেস পয়েন্ট", watts: 15 },
    { cat: "building", name: "Network Switch / LAN Hub", bn: "নেটওয়ার্ক সুইচ / ল্যান হাব", watts: 25 },
    { cat: "building", name: "Building PA / Announcement System", bn: "বিল্ডিং পিএ / অ্যানাউন্সমেন্ট সিস্টেম", watts: 50 },
    { cat: "building", name: "Automatic Voltage Regulator (AVR / Stabilizer)", bn: "অটোমেটিক ভোল্টেজ রেগুলেটর (এভিআর / স্ট্যাবিলাইজার)", watts: 30 },
    { cat: "building", name: "IPS / Inverter System (standby draw)", bn: "আইপিএস / ইনভার্টার সিস্টেম (স্ট্যান্ডবাই)", watts: 100 },
    { cat: "building", name: "Solar Charge Controller", bn: "সোলার চার্জ কন্ট্রোলার", watts: 10 },

    // Other
    { cat: "other", name: "CCTV Camera (single)", bn: "সিসিটিভি ক্যামেরা (একটি)", watts: 15 },
    { cat: "other", name: "IP Camera / Smart Camera", bn: "আইপি ক্যামেরা / স্মার্ট ক্যামেরা", watts: 8 },
    { cat: "other", name: "DVR / NVR Recorder (standalone)", bn: "ডিভিআর / এনভিআর রেকর্ডার (স্বতন্ত্র)", watts: 25 },
    { cat: "other", name: "Video Doorbell", bn: "ভিডিও ডোরবেল", watts: 5 },
    { cat: "other", name: "Home Security Alarm Panel", bn: "হোম সিকিউরিটি অ্যালার্ম প্যানেল", watts: 10 },
    { cat: "other", name: "Smart Home Hub / Controller", bn: "স্মার্ট হোম হাব / কন্ট্রোলার", watts: 8 },
    { cat: "other", name: "Sewing Machine", bn: "সেলাই মেশিন", watts: 100 },
    { cat: "other", name: "Vacuum Cleaner", bn: "ভ্যাকুয়াম ক্লিনার", watts: 1400 },
    { cat: "other", name: "Air Purifier", bn: "এয়ার পিউরিফায়ার", watts: 50 },
    { cat: "other", name: "Inverter / UPS (home)", bn: "ইনভার্টার / ইউপিএস (হোম)", watts: 50 },
    { cat: "other", name: "Mosquito Killer", bn: "মশা মারার যন্ত্র", watts: 10 },
    { cat: "other", name: "Electric Mosquito Bat (charging)", bn: "ইলেকট্রিক মশার ব্যাট (চার্জিং)", watts: 5 },
  ];

  // Common wattage presets for the Watt combobox (ascending). Users can add any value.
  const WATT_PRESETS = [
    5, 8, 9, 10, 15, 18, 20, 25, 30, 40, 50, 60, 65, 75, 80, 100, 120, 150, 200,
    250, 300, 375, 400, 500, 700, 750, 800, 1000, 1100, 1200, 1500, 2000, 2238,
    2500, 3000, 3730, 5000, 7500, 10000,
  ];

  // Ready-made scenario presets. hoursUnit: "h/day" | "min/day" | "h/week" | "min/week".
  const SCENARIOS = [
    {
      key: "flat2",
      title: "Flat — 2 people",
      periodDays: 30,
      occupiedDays: 25,
      items: [
        { name: "Inverter Double-door Fridge / Freezer", watts: 100, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Ceiling Fan", watts: 75, hours: 12, hoursUnit: "h/day", daysMode: "present" },
        { name: "LED Bulb", watts: 15, hours: 6, hoursUnit: "h/day", daysMode: "present" },
        { name: "LED TV (43\")", watts: 80, hours: 4, hoursUnit: "h/day", daysMode: "present" },
        { name: "Rice Cooker", watts: 700, hours: 30, hoursUnit: "min/day", daysMode: "present" },
        { name: "Electric Kettle", watts: 1500, hours: 10, hoursUnit: "min/day", daysMode: "present", note: "~2 min/use × 5 uses/day" },
        { name: "Mobile Charger", watts: 10, hours: 3, hoursUnit: "h/day", daysMode: "present" },
        { name: "Wi-Fi Router", watts: 10, hours: 24, hoursUnit: "h/day", daysMode: "present" },
      ],
    },
    {
      key: "flat4",
      title: "Flat — 4 people",
      periodDays: 30,
      occupiedDays: 28,
      items: [
        { name: "Double-door Fridge / Freezer", watts: 200, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Air Conditioner (1.5 ton)", watts: 1500, hours: 8, hoursUnit: "h/day", daysMode: "present", note: "Living room" },
        { name: "Air Conditioner (1 ton)", watts: 1000, hours: 7, hoursUnit: "h/day", daysMode: "present", note: "Bedroom 2" },
        { name: "Ceiling Fan", watts: 75, hours: 14, hoursUnit: "h/day", daysMode: "present" },
        { name: "Ceiling Fan (2)", watts: 75, hours: 10, hoursUnit: "h/day", daysMode: "present", note: "Bedroom" },
        { name: "LED Tube Light", watts: 18, hours: 6, hoursUnit: "h/day", daysMode: "present" },
        { name: "LED Tube Light (2)", watts: 18, hours: 3, hoursUnit: "h/day", daysMode: "present", note: "Kitchen & bathroom" },
        { name: "LED TV (43\")", watts: 80, hours: 5, hoursUnit: "h/day", daysMode: "present" },
        { name: "Rice Cooker", watts: 700, hours: 45, hoursUnit: "min/day", daysMode: "present" },
        { name: "Washing Machine", watts: 500, hours: 3, hoursUnit: "h/week", daysMode: "all" },
        { name: "Mobile Charger", watts: 10, hours: 4, hoursUnit: "h/day", daysMode: "present" },
        { name: "Mobile Charger (2)", watts: 10, hours: 3, hoursUnit: "h/day", daysMode: "present" },
        { name: "Wi-Fi Router", watts: 10, hours: 24, hoursUnit: "h/day", daysMode: "present" },
        { name: "IPS / Inverter System (standby draw)", watts: 100, hours: 24, hoursUnit: "h/day", daysMode: "all", note: "Standby power for backup" },
      ],
    },
    {
      key: "flatGuest",
      title: "Flat — with guest (mid-period)",
      periodDays: 30,
      occupiedDays: 22,
      items: [
        { name: "Double-door Fridge / Freezer", watts: 200, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Air Conditioner (1.5 ton)", watts: 1500, hours: 8, hoursUnit: "h/day", daysMode: "present" },
        { name: "Air Conditioner (1 ton)", watts: 1000, hours: 7, hoursUnit: "h/day", daysMode: "custom", days: 7, note: "Guest room — 7-day visit" },
        { name: "Ceiling Fan", watts: 75, hours: 12, hoursUnit: "h/day", daysMode: "present" },
        { name: "LED Tube Light", watts: 18, hours: 5, hoursUnit: "h/day", daysMode: "present" },
        { name: "Rice Cooker", watts: 700, hours: 30, hoursUnit: "min/day", daysMode: "present" },
        { name: "Electric Kettle", watts: 1500, hours: 15, hoursUnit: "min/day", daysMode: "custom", days: 7, note: "Guest use only" },
        { name: "Mobile Charger", watts: 10, hours: 3, hoursUnit: "h/day", daysMode: "present" },
        { name: "Wi-Fi Router", watts: 10, hours: 24, hoursUnit: "h/day", daysMode: "all" },
      ],
    },
    {
      key: "building",
      title: "Whole building (common areas)",
      periodDays: 30,
      occupiedDays: "",
      items: [
        { name: "Lift / Elevator (6-person)", watts: 5000, hours: 4, hoursUnit: "h/day", daysMode: "all", note: "Estimated avg daily run time" },
        { name: "Corridor / Stairwell LED Light", watts: 18, hours: 12, hoursUnit: "h/day", daysMode: "all" },
        { name: "Corridor / Stairwell LED Light (2)", watts: 18, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Floor 3–6" },
        { name: "Lobby / Reception Light", watts: 50, hours: 14, hoursUnit: "h/day", daysMode: "all" },
        { name: "Common Area Ceiling Fan", watts: 75, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Guard room fan 1" },
        { name: "Common Area Ceiling Fan (2)", watts: 75, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Guard room fan 2" },
        { name: "Corridor / Stairwell LED Light (3)", watts: 18, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Guard area" },
        { name: "Water Motor (3 HP)", watts: 2238, hours: 90, hoursUnit: "min/day", daysMode: "all", note: "3× 30 min rooftop fill/day" },
        { name: "CCTV / NVR System (8 cameras)", watts: 120, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Electric Gate Motor", watts: 200, hours: 1, hoursUnit: "h/day", daysMode: "all", note: "Opening/closing cycles" },
        { name: "Building WiFi Access Point", watts: 15, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Building Intercom System", watts: 30, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Fire Alarm System Panel", watts: 50, hours: 24, hoursUnit: "h/day", daysMode: "all" },
      ],
    },
    {
      key: "office",
      title: "Office / workspace (26 working days)",
      periodDays: 26,
      occupiedDays: "",
      items: [
        { name: "Air Conditioner (1.5 ton)", watts: 1500, hours: 8, hoursUnit: "h/day", daysMode: "all", note: "Main hall" },
        { name: "Air Conditioner (1 ton)", watts: 1000, hours: 6, hoursUnit: "h/day", daysMode: "all", note: "Manager cabin" },
        { name: "LED Tube Light", watts: 18, hours: 9, hoursUnit: "h/day", daysMode: "all" },
        { name: "Desktop Computer", watts: 200, hours: 8, hoursUnit: "h/day", daysMode: "all" },
        { name: "Desktop Computer (2)", watts: 200, hours: 8, hoursUnit: "h/day", daysMode: "all" },
        { name: "Monitor", watts: 30, hours: 8, hoursUnit: "h/day", daysMode: "all" },
        { name: "Laptop", watts: 65, hours: 8, hoursUnit: "h/day", daysMode: "all" },
        { name: "Wi-Fi Router", watts: 10, hours: 24, hoursUnit: "h/day", daysMode: "all" },
        { name: "Common Area Ceiling Fan", watts: 75, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Guard room fan 1" },
        { name: "Common Area Ceiling Fan (2)", watts: 75, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Guard room fan 2" },
        { name: "LED Tube Light (2)", watts: 18, hours: 12, hoursUnit: "h/day", daysMode: "all", note: "Guard area" },
        { name: "Printer", watts: 50, hours: 30, hoursUnit: "min/day", daysMode: "all" },
        { name: "Electric Kettle", watts: 1500, hours: 10, hoursUnit: "min/day", daysMode: "all", note: "~2 uses/day staff tea" },
      ],
    },
  ];

  window.ECData = { CATEGORIES, DEVICES, WATT_PRESETS, SCENARIOS };
})();
