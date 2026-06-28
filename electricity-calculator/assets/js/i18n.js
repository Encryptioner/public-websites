/**
 * i18n.js — bilingual UI strings (English + Bangla).
 *
 * window.ECi18n.t(key) returns the string for the active language.
 * Language is persisted in localStorage and applied by app.js.
 */
(function () {
  "use strict";

  const STR = {
    en: {
      langName: "English",
      appName: "Electricity Calculator",
      tagline: "Estimate your monthly electricity usage & units — device by device.",

      // Calculation entry
      titleLabel: "Calculation title",
      titlePlaceholder: "e.g. June bill — my flat",

      // Period
      periodHeading: "Billing period",
      periodHint: "How long is this bill for? Enter any number of days, or pick a date range.",
      modeDays: "Days",
      modeRange: "Date range",
      daysLabel: "Number of days",
      startLabel: "Start date",
      endLabel: "End date",
      daysComputed: "= {n} days",
      occupiedLabel: "Days present (optional)",
      occupiedHint: "If some devices run only while someone is home, enter those days here. Leave blank if all devices run the whole period.",

      // Add device
      addHeading: "Add a device",
      addHint: "Search or pick a device, set its wattage, usage, and schedule options, then add it.",
      deviceLabel: "Device",
      devicePlaceholder: "Search or pick a device…",
      wattLabel: "Power (watt)",
      wattPlaceholder: "Search or pick watt…",
      hoursLabel: "Hours per day",
      addBtn: "Add device",
      addCustomLabel: 'Add "{q}"',
      addCustomWatt: 'Use {q} W',
      noMatches: "No matches — type to add a new one",
      groupOther: "Custom",

      // Items
      itemsHeading: "Your devices",
      emptyTitle: "No devices yet",
      emptyHint: 'Add devices above, or tap "Load sample" to see an example.',
      wattShort: "W",
      toTopLabel: "Back to top",
      hoursShort: "h/day",
      perDay: "/day",
      remove: "Remove",
      duplicate: "Duplicate",
      daysUsedLabel: "Days used",
      everyDayLabel: "Runs every billing day",
      srcAll: "All days",
      srcPresent: "Present days",
      srcCustom: "Custom",
      segmentsToggle: "Split usage (different hours on different days)",
      segHours: "Hours/day",
      segDays: "Days",
      addSegment: "+ Add usage span",
      removeSegment: "Remove span",
      segSumNote: "Spans total {d} days · {h} device-hours",
      summaryHeading: "Summary",
      summaryHint: "Preview of your PDF report.",

      // Results
      resultsHeading: "Result",
      totalLabel: "Total usage",
      unit: "kWh (units)",
      perDeviceHeading: "Per-device breakdown",
      formulaHeading: "How this was calculated",
      noResult: "Add a device to see your usage.",
      ofTotal: "of total",

      // Actions
      loadSample: "Load sample",
      loadScenario: "Load scenario…",
      clearAll: "Clear all devices",
      reset: "Reset",
      save: "Save",
      downloadPdf: "Download PDF",
      saved: "Saved ✓",
      history: "History",
      historyEmpty: "No saved calculations yet.",
      load: "Load",
      delete: "Delete",
      // Tooltips
      tipSplit: "Split this device into multiple time spans with different hours",
      tipAddNote: "Add an optional note for this device",
      tipHideNote: "Remove the note from this device",
      tipAddSegment: "Add another usage span",
      tipClearAll: "Remove all devices but keep billing period and title",
      tipReset: "Clear everything and start fresh",
      tipAddItem: "Scroll up to add a new device",
      tipDuplicate: "Create a copy of this device",
      tipRemove: "Remove this device",
      tipRemoveSegment: "Remove this usage span",
      tipDeleteHistory: "Delete this saved calculation",
      confirmReset: "Clear all devices and start over?",
      confirmLoadScenario: "Replace current devices with scenario? Billing period and calculation title is kept.",
      confirmClearDevices: "Remove all devices? Billing period and title are kept.",
      confirmDelete: "Delete this saved calculation?",
      dialogConfirm: "Confirm",
      dialogCancel: "Cancel",
      scrolledToResults: "Showing results ↓",
      savedAt: "Saved {when}",

      // FAQ / info
      faqHeading: "How it works & FAQ",
      faq: [
        {
          q: "How is electricity usage (kWh / units) calculated?",
          a: "Electricity is billed in kilowatt-hours (kWh), also called \"units\". One unit = 1000 watts running for 1 hour. The formula for one device is: <b>kWh = watts × hours per day × number of days ÷ 1000</b>. We add this up for every device to get your total units for the period.",
        },
        {
          q: "What is the difference between a watt and a unit?",
          a: "A <b>watt (W)</b> is how much power a device draws while running. A <b>unit (kWh)</b> is how much energy it uses over time. A 1000 W heater on for 1 hour uses 1 unit. The same heater on for 30 minutes uses half a unit.",
        },
        {
          q: "How do I find a device's wattage?",
          a: "Check the rating label or sticker on the device (often near the power cord or on the back/bottom), the user manual, or the box. It is shown as \"W\" or \"Watt\". For motors it may say HP (1 HP ≈ 746 W). If unsure, pick the closest match from our list — the typical value auto-fills and you can adjust it.",
        },
        {
          q: "How do I handle constant vs occasional devices (real-life scenarios)?",
          a: "Every device has <b>Hours/day</b> and <b>Days used</b>, so you can match any situation:<br>• <b>Constant</b> (fridge, Wi-Fi router): keep <b>“Runs every billing day”</b> on — it always uses the full period.<br>• <b>Occasional</b> (a light or fan used only the 20 days someone stays in a 30-day flat): turn that off and set <b>Days used = 20</b>.<br>• <b>Variable</b> (AC run 6 h/day for 6 days, then 3 h/day for 24 days): turn on <b>Split usage</b> and add one span per pattern.",
        },
        {
          q: "My device runs different hours on different days — what do I do?",
          a: "Open a device and turn on <b>Split usage</b>. Add one span per pattern. Example: an AC used 6 hours/day for the first 6 days, then 3 hours/day for the next 24 days — add two spans. The device total is the sum of all spans.",
        },
        {
          q: "Why don't the kWh match my bill exactly?",
          a: "Real usage varies and wattage labels show the maximum draw, not the average. Fridges and ACs cycle on and off, so they use less than rated. Use this as a close estimate to find which devices cost the most, then fine-tune the hours.",
        },
        {
          q: "How do I estimate the cost in money?",
          a: "Multiply your total units by your local per-unit tariff. Example: 250 units × 7 BDT/unit = 1750 BDT (plus fixed charges and slabs that vary by provider). Tariffs are slab-based in Bangladesh, so higher usage costs more per unit.",
        },
        {
          q: "Is my data saved? Does it work offline?",
          a: "Your current work and saved calculations stay in your browser's local storage — nothing is sent to any server. The page works offline once loaded; only the PDF download needs an internet connection the first time (it loads a small library).",
        },
      ],

      // Hours unit selector
      unitHDay: "hr/day",
      unitMinDay: "min/day",
      unitHWeek: "hr/week",
      unitMinWeek: "min/week",
      minuteShort: "min",
      weekShort: "weeks",
      hoursLabelMinDay: "Minutes per day",
      hoursLabelHWeek: "Hours per week",
      hoursLabelMinWeek: "Minutes per week",

      // Note per device
      addNote: "+ Add note",
      hideNote: "Hide note",
      notePlaceholder: "Optional note about this device…",
      noteLabel: "Note",
      occupiedExceedsError: "Cannot exceed total days ({n})",
      customDaysExceedsError: "Cannot exceed billing period ({n} days)",
      segmentDaysExceedsError: "Segment days ({d}) exceed billing period ({n} days)",
      dateRangeError: "Start date must be before end date",

      // PDF
      pdfTitle: "Electricity Usage Report",
      pdfPeriod: "Billing period",
      pdfPeriodRange: "Billing period ({start} – {end})",
      pdfPresentDays: "Days present",
      pdfNote: "Note",
      pdfDevice: "Device",
      pdfWatts: "Watt",
      pdfUsage: "Usage",
      pdfKwh: "Units (kWh)",
      pdfPercent: "% of total",
      pdfTotal: "Total",
      pdfGenerated: "Generated",
      pdfFooter: "Made with Electricity Calculator",
      days: "days",
    },

    bn: {
      langName: "বাংলা",
      appName: "বিদ্যুৎ ক্যালকুলেটর",
      tagline: "প্রতিটি ডিভাইস ধরে আপনার মাসিক বিদ্যুৎ খরচ ও ইউনিট হিসাব করুন।",

      titleLabel: "হিসাবের শিরোনাম",
      titlePlaceholder: "যেমন: জুন মাসের বিল — আমার ফ্ল্যাট",

      periodHeading: "বিলিং সময়কাল",
      periodHint: "এই বিল কত দিনের? যেকোনো সংখ্যক দিন লিখুন, অথবা তারিখের পরিসর বেছে নিন।",
      modeDays: "দিন",
      modeRange: "তারিখের পরিসর",
      daysLabel: "দিনের সংখ্যা",
      startLabel: "শুরুর তারিখ",
      endLabel: "শেষ তারিখ",
      daysComputed: "= {n} দিন",
      occupiedLabel: "উপস্থিত দিন (ঐচ্ছিক)",
      occupiedHint: "কিছু ডিভাইস শুধু কেউ বাসায় থাকলে চলে — সেই দিনগুলো এখানে দিন। সব ডিভাইস পুরো সময় চললে খালি রাখুন।",

      addHeading: "ডিভাইস যোগ করুন",
      addHint: "ডিভাইস খুঁজুন বা বেছে নিন, ওয়াট, ব্যবহার ও সময়সূচির অপশন ঠিক করুন, তারপর যোগ করুন।",
      deviceLabel: "ডিভাইস",
      devicePlaceholder: "ডিভাইস খুঁজুন বা বেছে নিন…",
      wattLabel: "ক্ষমতা (ওয়াট)",
      wattPlaceholder: "ওয়াট খুঁজুন বা বেছে নিন…",
      hoursLabel: "দৈনিক ব্যবহার (ঘণ্টা)",
      addBtn: "ডিভাইস যোগ করুন",
      addCustomLabel: '"{q}" যোগ করুন',
      addCustomWatt: '{q} ওয়াট ব্যবহার করুন',
      noMatches: "কোনো মিল নেই — নতুন যোগ করতে টাইপ করুন",
      groupOther: "কাস্টম",

      itemsHeading: "আপনার ডিভাইস",
      emptyTitle: "এখনো কোনো ডিভাইস নেই",
      emptyHint: 'উপরে ডিভাইস যোগ করুন, অথবা "নমুনা দেখুন"-এ চাপ দিন।',
      wattShort: "ওয়াট",
      toTopLabel: "উপরে যান",
      hoursShort: "ঘ/দিন",
      perDay: "/দিন",
      remove: "মুছুন",
      duplicate: "অনুলিপি",
      daysUsedLabel: "যত দিন ব্যবহার",
      everyDayLabel: "প্রতিদিন চলে",
      srcAll: "সব দিন",
      srcPresent: "উপস্থিত দিন",
      srcCustom: "কাস্টম",
      segmentsToggle: "ব্যবহার ভাগ করুন (ভিন্ন দিনে ভিন্ন ঘণ্টা)",
      segHours: "ঘণ্টা/দিন",
      segDays: "দিন",
      addSegment: "+ ব্যবহারের ধাপ যোগ করুন",
      removeSegment: "ধাপ মুছুন",
      segSumNote: "মোট {d} দিন · {h} ডিভাইস-ঘণ্টা",
      summaryHeading: "সারসংক্ষেপ",
      summaryHint: "আপনার পিডিএফ রিপোর্টের প্রিভিউ।",

      resultsHeading: "ফলাফল",
      totalLabel: "মোট খরচ",
      unit: "কিলোওয়াট-ঘণ্টা (ইউনিট)",
      perDeviceHeading: "ডিভাইস অনুযায়ী বিভাজন",
      formulaHeading: "কীভাবে হিসাব করা হলো",
      noResult: "খরচ দেখতে একটি ডিভাইস যোগ করুন।",
      ofTotal: "মোটের",

      loadSample: "নমুনা দেখুন",
      loadScenario: "পরিস্থিতি লোড করুন…",
      clearAll: "সব ডিভাইস মুছুন",
      reset: "রিসেট",
      save: "সংরক্ষণ",
      downloadPdf: "পিডিএফ ডাউনলোড",
      saved: "সংরক্ষিত ✓",
      history: "ইতিহাস",
      historyEmpty: "এখনো কোনো সংরক্ষিত হিসাব নেই।",
      load: "লোড করুন",
      delete: "মুছুন",
      // Tooltips
      tipSplit: "এই ডিভাইসকে ভিন্ন ঘণ্টাসহ ভিন্ন সময় স্প্যানে ভাগ করুন",
      tipAddNote: "এই ডিভাইসে একটি ঐচ্ছিক নোট যোগ করুন",
      tipHideNote: "এই ডিভাইস থেকে নোট সরান",
      tipAddSegment: "আরেকটি ব্যবহারের ধাপ যোগ করুন",
      tipClearAll: "সব ডিভাইস মুছুন কিন্তু বিলিং সময়কাল ও শিরোনাম রাখুন",
      tipReset: "সব মুছে নতুন করে শুরু করুন",
      tipAddItem: "নতুন ডিভাইস যোগ করতে উপরে যান",
      tipDuplicate: "এই ডিভাইসের একটি অনুলিপি তৈরি করুন",
      tipRemove: "এই ডিভাইস মুছুন",
      tipRemoveSegment: "এই ব্যবহারের ধাপ মুছুন",
      tipDeleteHistory: "এই সংরক্ষিত হিসাব মুছুন",
      confirmReset: "সব ডিভাইস মুছে নতুন করে শুরু করবেন?",
      confirmLoadScenario: "বর্তমান ডিভাইসগুলো পরিস্থিতি দিয়ে প্রতিস্থাপন করবেন? বিলিং সময়কাল ও হিসাবের শিরোনাম থাকবে।",
      confirmClearDevices: "সব ডিভাইস মুছবেন? বিলিং সময়কাল ও শিরোনাম থাকবে।",
      confirmDelete: "এই সংরক্ষিত হিসাবটি মুছবেন?",
      dialogConfirm: "নিশ্চিত করুন",
      dialogCancel: "বাতিল",
      scrolledToResults: "ফলাফল দেখানো হচ্ছে ↓",
      savedAt: "{when} সংরক্ষিত",

      faqHeading: "কীভাবে কাজ করে ও সাধারণ প্রশ্ন",
      faq: [
        {
          q: "বিদ্যুৎ খরচ (কিলোওয়াট-ঘণ্টা / ইউনিট) কীভাবে হিসাব হয়?",
          a: "বিদ্যুৎ মাপা হয় কিলোওয়াট-ঘণ্টায় (kWh), যাকে \"ইউনিট\"ও বলা হয়। ১ ইউনিট = ১০০০ ওয়াট ১ ঘণ্টা চললে। একটি ডিভাইসের সূত্র: <b>kWh = ওয়াট × দৈনিক ঘণ্টা × দিন ÷ ১০০০</b>। সব ডিভাইসের যোগফলই আপনার মোট ইউনিট।",
        },
        {
          q: "ওয়াট আর ইউনিটের পার্থক্য কী?",
          a: "<b>ওয়াট (W)</b> হলো একটি ডিভাইস চলার সময় কত শক্তি টানে তা। <b>ইউনিট (kWh)</b> হলো সময় ধরে কত শক্তি ব্যবহার হলো তা। ১০০০ ওয়াটের হিটার ১ ঘণ্টা চললে ১ ইউনিট খরচ; ৩০ মিনিট চললে অর্ধেক ইউনিট।",
        },
        {
          q: "ডিভাইসের ওয়াট কোথায় পাবো?",
          a: "ডিভাইসের গায়ের রেটিং লেবেল বা স্টিকার (সাধারণত তারের কাছে বা পেছনে/নিচে), ম্যানুয়াল বা বাক্সে দেখুন — \"W\" বা \"ওয়াট\" লেখা থাকে। মোটরের ক্ষেত্রে HP থাকতে পারে (১ HP ≈ ৭৪৬ ওয়াট)। নিশ্চিত না হলে তালিকা থেকে কাছাকাছি বেছে নিন — সাধারণ মান বসে যাবে, পরে বদলাতে পারবেন।",
        },
        {
          q: "সবসময় চলা ও মাঝে মাঝে চলা ডিভাইস কীভাবে হিসাব করবো (বাস্তব পরিস্থিতি)?",
          a: "প্রতিটি ডিভাইসে <b>ঘণ্টা/দিন</b> ও <b>যত দিন ব্যবহার</b> আছে, তাই যেকোনো পরিস্থিতি মেলানো যায়:<br>• <b>সবসময়</b> (ফ্রিজ, রাউটার): <b>“প্রতিদিন চলে”</b> চালু রাখুন — পুরো সময়জুড়ে চলবে।<br>• <b>মাঝে মাঝে</b> (৩০ দিনের ফ্ল্যাটে কেউ ২০ দিন থাকলে লাইট/ফ্যান): এটি বন্ধ করে <b>যত দিন ব্যবহার = ২০</b> দিন।<br>• <b>পরিবর্তনশীল</b> (এসি ৬ দিন ৬ ঘণ্টা, পরের ২৪ দিন ৩ ঘণ্টা): <b>ব্যবহার ভাগ করুন</b> চালু করে প্রতিটির জন্য ধাপ যোগ করুন।",
        },
        {
          q: "আমার ডিভাইস ভিন্ন দিনে ভিন্ন ঘণ্টা চলে — কী করবো?",
          a: "ডিভাইস খুলে <b>ব্যবহার ভাগ করুন</b> চালু করুন। প্রতিটি ধরনের জন্য একটি ধাপ যোগ করুন। যেমন: এসি প্রথম ৬ দিন ৬ ঘণ্টা, পরের ২৪ দিন ৩ ঘণ্টা — দুটি ধাপ যোগ করুন। সব ধাপের যোগফলই মোট।",
        },
        {
          q: "বিলের সাথে হুবহু মিলছে না কেন?",
          a: "বাস্তব ব্যবহার বদলায় এবং লেবেলের ওয়াট সর্বোচ্চ টান দেখায়, গড় নয়। ফ্রিজ ও এসি বারবার চালু-বন্ধ হয়, তাই কম খরচ করে। এটি কাছাকাছি অনুমান হিসেবে ব্যবহার করে দেখুন কোন ডিভাইসে বেশি খরচ, তারপর ঘণ্টা ঠিক করুন।",
        },
        {
          q: "টাকায় খরচ কীভাবে বের করবো?",
          a: "মোট ইউনিটকে আপনার স্থানীয় প্রতি-ইউনিট দর দিয়ে গুণ করুন। যেমন: ২৫০ ইউনিট × ৭ টাকা/ইউনিট = ১৭৫০ টাকা (এর সাথে নির্দিষ্ট চার্জ ও স্ল্যাব যোগ হয়)। বাংলাদেশে দর স্ল্যাব-ভিত্তিক, বেশি খরচে প্রতি ইউনিট দরও বাড়ে।",
        },
        {
          q: "আমার তথ্য কি সংরক্ষিত থাকে? অফলাইনে চলে?",
          a: "আপনার চলতি কাজ ও সংরক্ষিত হিসাব আপনার ব্রাউজারের লোকাল স্টোরেজে থাকে — কোনো সার্ভারে পাঠানো হয় না। লোড হওয়ার পর পেজটি অফলাইনে চলে; শুধু পিডিএফ ডাউনলোডের জন্য প্রথমবার ইন্টারনেট লাগে।",
        },
      ],

      // Hours unit selector
      unitHDay: "ঘণ্টা/দিন",
      unitMinDay: "মিনিট/দিন",
      unitHWeek: "ঘণ্টা/সপ্তাহ",
      unitMinWeek: "মিনিট/সপ্তাহ",
      minuteShort: "মিনিট",
      weekShort: "সপ্তাহ",
      hoursLabelMinDay: "দৈনিক ব্যবহার (মিনিট)",
      hoursLabelHWeek: "সাপ্তাহিক ব্যবহার (ঘণ্টা)",
      hoursLabelMinWeek: "সাপ্তাহিক ব্যবহার (মিনিট)",

      // Note per device
      addNote: "+ নোট যোগ করুন",
      hideNote: "নোট লুকান",
      notePlaceholder: "এই ডিভাইস সম্পর্কে ঐচ্ছিক নোট…",
      noteLabel: "নোট",
      occupiedExceedsError: "মোট দিনের ({n}) বেশি হতে পারবে না",
      customDaysExceedsError: "বিলিং সময়কালের ({n} দিন) বেশি হতে পারবে না",
      segmentDaysExceedsError: "ধাপের দিন ({d}) বিলিং সময়কালের ({n} দিন) বেশি",
      dateRangeError: "শুরুর তারিখ শেষ তারিখের আগে হতে হবে",

      // PDF
      pdfTitle: "বিদ্যুৎ খরচের রিপোর্ট",
      pdfPeriod: "বিলিং সময়কাল",
      pdfPeriodRange: "বিলিং সময়কাল ({start} – {end})",
      pdfPresentDays: "উপস্থিত দিন",
      pdfNote: "নোট",
      pdfDevice: "ডিভাইস",
      pdfWatts: "ওয়াট",
      pdfUsage: "ব্যবহার",
      pdfKwh: "ইউনিট (kWh)",
      pdfPercent: "% মোটের",
      pdfTotal: "মোট",
      pdfGenerated: "তৈরি",
      pdfFooter: "Electricity Calculator দিয়ে তৈরি",
      days: "দিন",
    },
  };

  // category labels keyed to data.js CATEGORIES
  STR.en.categories = {
    kitchen: "Kitchen",
    cooling: "Cooling & Heating",
    lighting: "Lighting",
    fans: "Fans",
    entertainment: "Entertainment",
    laundry: "Laundry",
    personalCare: "Personal Care",
    charging: "Charging & Computing",
    water: "Water & Pump",
    building: "Building & Common Areas",
    other: "Other",
  };
  STR.bn.categories = {
    kitchen: "রান্নাঘর",
    cooling: "শীতলীকরণ ও উষ্ণতা",
    lighting: "আলো",
    fans: "ফ্যান",
    entertainment: "বিনোদন",
    laundry: "কাপড় ধোয়া",
    personalCare: "ব্যক্তিগত যত্ন",
    charging: "চার্জিং ও কম্পিউটিং",
    water: "পানি ও পাম্প",
    building: "বিল্ডিং ও কমন এরিয়া",
    other: "অন্যান্য",
  };

  let lang = "en";

  function setLang(l) {
    lang = STR[l] ? l : "en";
  }
  function getLang() {
    return lang;
  }
  function t(key) {
    const v = STR[lang][key];
    return v == null ? STR.en[key] : v;
  }
  function dict() {
    return STR[lang];
  }
  // Fill {placeholders} in a template string.
  function fmt(template, vars) {
    return String(template).replace(/\{(\w+)\}/g, (_, k) =>
      vars && k in vars ? vars[k] : "{" + k + "}"
    );
  }

  window.ECi18n = { setLang, getLang, t, dict, fmt, STR };
})();
