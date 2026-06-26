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
    "other",
  ];

  // name = English, bn = Bangla, watts = typical wattage (W).
  const DEVICES = [
    // Kitchen
    { cat: "kitchen", name: "Refrigerator", bn: "ফ্রিজ", watts: 150 },
    { cat: "kitchen", name: "Double-door Fridge / Freezer", bn: "ডাবল-ডোর ফ্রিজ / ফ্রিজার", watts: 200 },
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
    { cat: "water", name: "Aquarium Pump", bn: "অ্যাকোয়ারিয়াম পাম্প", watts: 20 },

    // Other
    { cat: "other", name: "CCTV Camera", bn: "সিসিটিভি ক্যামেরা", watts: 15 },
    { cat: "other", name: "Sewing Machine", bn: "সেলাই মেশিন", watts: 100 },
    { cat: "other", name: "Vacuum Cleaner", bn: "ভ্যাকুয়াম ক্লিনার", watts: 1400 },
    { cat: "other", name: "Air Purifier", bn: "এয়ার পিউরিফায়ার", watts: 50 },
    { cat: "other", name: "Inverter / UPS", bn: "ইনভার্টার / ইউপিএস", watts: 50 },
    { cat: "other", name: "Mosquito Killer", bn: "মশা মারার যন্ত্র", watts: 10 },
  ];

  // Common wattage presets for the Watt combobox (ascending). Users can add any value.
  const WATT_PRESETS = [
    5, 9, 10, 15, 18, 20, 25, 30, 40, 50, 60, 65, 75, 80, 100, 120, 150, 200,
    250, 300, 375, 400, 500, 700, 750, 800, 1000, 1100, 1200, 1500, 2000, 2500,
  ];

  // A ready-made example home so users can "Load sample data" and learn by editing.
  // segments: list of { hours, days } usage spans for that device.
  // Demonstrates the variable-usage case (AC: 6h for 6 days, then 3h for 24 days).
  const SAMPLE = {
    title: "Sample Home — Monthly Usage",
    periodDays: 30,
    items: [
      { name: "Double-door Fridge / Freezer", watts: 200, segments: [{ hours: 24, days: 30 }] },
      { name: "Air Conditioner (1.5 ton)", watts: 1500, segments: [{ hours: 6, days: 6 }, { hours: 3, days: 24 }] },
      { name: "Ceiling Fan", watts: 75, segments: [{ hours: 14, days: 30 }] },
      { name: "LED Tube Light", watts: 18, segments: [{ hours: 6, days: 30 }] },
      { name: "LED TV (43\")", watts: 80, segments: [{ hours: 4, days: 30 }] },
      { name: "Rice Cooker", watts: 700, segments: [{ hours: 1, days: 30 }] },
      { name: "Mobile Charger", watts: 10, segments: [{ hours: 3, days: 30 }] },
    ],
  };

  window.ECData = { CATEGORIES, DEVICES, WATT_PRESETS, SAMPLE };
})();
