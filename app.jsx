const { useEffect, useMemo, useRef, useState } = React;

const DB = {
  item_categories: [
    { id: "battery", label: "Batteries / Power banks", group: "Batteries & electronics", keywords: ["battery", "powerbank", "power bank", "akku"] },
    { id: "liquid", label: "Liquids", group: "Liquids", keywords: ["liquid", "water", "perfume", "drink"] },
    { id: "knife", label: "Knives / Scissors", group: "Sharp objects", keywords: ["knife", "scissors", "blade"] },
    { id: "tool", label: "Tools", group: "Tools", keywords: ["tool", "screwdriver", "drill"] },
    { id: "lighter", label: "Lighters / Matches", group: "Restricted", keywords: ["lighter", "matches"] },
    { id: "ecig", label: "E-cigarettes / E-pipes / E-cigars", group: "Batteries & electronics", keywords: ["vape", "ecig", "e-cigarette"] },
    { id: "smart_luggage", label: "Smart luggage", group: "Batteries & electronics", keywords: ["smart luggage", "suitcase"] },
    { id: "blunt", label: "Blunt objects (bats, golf clubs, hammers)", group: "Sports / tools", keywords: ["bat", "golf", "hammer"] },
    { id: "prohibited", label: "Fireworks / gas cartridges / corrosives", group: "Prohibited", keywords: ["firework", "sparklers", "gas", "acid"] },
    { id: "electronics", label: "Laptops / tablets / phones / cameras", group: "Electronics", keywords: ["laptop", "phone", "camera", "tablet"] },
  ],
  item_questions: {
    battery: [
      { key: "mah", label: "Battery capacity (mAh)", type: "number", min: 1, required: true },
      { key: "voltage", label: "Voltage (V)", type: "number", min: 0.1, step: "0.1", required: true },
      { key: "spareCount", label: "How many spare batteries are you carrying?", type: "number", min: 0, required: true },
      {
        key: "installed",
        label: "Is the battery installed in a device?",
        type: "select",
        required: true,
        options: [
          { value: "spare", label: "Spare / loose battery" },
          { value: "installed", label: "Installed in a device" },
        ],
      },
    ],
    liquid: [
      { key: "volume", label: "Container volume (ml)", type: "number", min: 1, required: true },
      {
        key: "kind",
        label: "Liquid type",
        type: "select",
        required: true,
        options: [
          { value: "normal", label: "Regular liquid" },
          { value: "medication", label: "Medication / baby food / special travel food" },
          { value: "duty_free", label: "Duty-free liquid with receipt in sealed ICAO bag" },
        ],
      },
    ],
    knife: [{ key: "bladeCm", label: "Blade length (cm)", type: "number", min: 0, required: true }],
    tool: [{ key: "bladeCm", label: "Tool length / blade length (cm)", type: "number", min: 0, required: true }],
    lighter: [
      {
        key: "onPerson",
        label: "Will it be carried on your person (not in baggage)?",
        type: "boolean",
        required: true,
      },
    ],
    smart_luggage: [
      {
        key: "batteryType",
        label: "Battery configuration",
        type: "select",
        required: true,
        options: [
          { value: "removable", label: "Removable lithium battery" },
          { value: "fixed", label: "Permanently installed lithium battery" },
        ],
      },
    ],
  },
  rule_sources: [
    "https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/what-is-allowed-in-your-bag",
    "https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/security-check",
    "https://www.flughafen-zuerich.ch/en/passengers/fly/all-about-the-flight/security-check/batterien",
  ],
};

const STATUS_STYLE = {
  allowed: "bg-green-100 text-green-900 border-green-300",
  conditional: "bg-amber-100 text-amber-900 border-amber-300",
  not_allowed: "bg-red-100 text-red-900 border-red-300",
};

function statusLabel(status) {
  if (status === "allowed") return "Allowed";
  if (status === "conditional") return "Allowed with conditions";
  return "Not allowed";
}

function evaluate(categoryId, answers) {
  const yes = { status: "allowed", note: "Allowed." };
  const no = { status: "not_allowed", note: "Not allowed." };

  switch (categoryId) {
    case "battery": {
      const mah = Number(answers.mah || 0);
      const voltage = Number(answers.voltage || 0);
      const spareCount = Number(answers.spareCount || 0);
      const installed = answers.installed;
      const wh = Number(((mah * voltage) / 1000).toFixed(1));

      if (wh > 160) {
        return {
          hand: { status: "not_allowed", note: `Over 160 Wh (${wh} Wh): prohibited.` },
          checked: { status: "not_allowed", note: `Over 160 Wh (${wh} Wh): prohibited.` },
          tip: "Do not travel with this battery.",
          facts: ["Formula used: Wh = mAh × V / 1000", `Computed energy: ${wh} Wh`],
        };
      }

      if (installed === "installed") {
        if (wh <= 160) {
          return {
            hand: { status: wh <= 100 ? "allowed" : "conditional", note: wh <= 100 ? `Installed battery (${wh} Wh) is allowed.` : `Installed battery ${wh} Wh: airline authorization required.` },
            checked: { status: wh <= 100 ? "allowed" : "conditional", note: wh <= 100 ? "Device with battery can typically be transported." : "Check-in may require airline authorization for this battery size." },
            tip: "Protect device from accidental activation.",
            facts: ["Formula used: Wh = mAh × V / 1000", `Computed energy: ${wh} Wh`],
          };
        }
      }

      if (wh > 100) {
        return {
          hand: {
            status: spareCount <= 2 ? "conditional" : "not_allowed",
            note: `100–160 Wh (${wh} Wh): max 2 spare batteries and airline authorization required.`,
          },
          checked: { ...no, note: "Spare lithium batteries are not allowed in checked baggage." },
          tip: "Carry in hand baggage only. Tape terminals and contact airline before departure.",
          facts: ["Formula used: Wh = mAh × V / 1000", `Computed energy: ${wh} Wh`, `Spare quantity entered: ${spareCount}`],
        };
      }

      return {
        hand: {
          status: spareCount <= 20 ? "conditional" : "not_allowed",
          note: `Up to 100 Wh (${wh} Wh): maximum 20 spare batteries; terminals must be taped.`,
        },
        checked: { ...no, note: "Spare lithium batteries are not allowed in checked baggage." },
        tip: "Place each spare battery in protective packaging.",
        facts: ["Formula used: Wh = mAh × V / 1000", `Computed energy: ${wh} Wh`, `Spare quantity entered: ${spareCount}`],
      };
    }

    case "liquid": {
      const volume = Number(answers.volume || 0);
      const kind = answers.kind;
      if (kind === "medication") {
        return {
          hand: { status: "conditional", note: "Larger quantities allowed for medication, baby food, and special travel food." },
          checked: yes,
          tip: "Carry supporting documentation where possible.",
          facts: ["100 ml / 1-litre rule still applies for regular liquids."],
        };
      }
      if (kind === "duty_free") {
        return {
          hand: { status: "conditional", note: "Allowed in hand baggage only with sealed ICAO bag and purchase receipt." },
          checked: yes,
          tip: "Keep bag sealed until final destination.",
          facts: [`Entered volume: ${volume} ml`],
        };
      }
      if (volume <= 100) {
        return {
          hand: { status: "conditional", note: "Allowed if each container is max 100 ml and packed in a 1-litre resealable bag." },
          checked: yes,
          tip: "Prepare liquids bag before security queue.",
          facts: [`Entered volume: ${volume} ml`],
        };
      }
      return {
        hand: { ...no, note: "Regular liquids over 100 ml are not allowed in hand baggage." },
        checked: yes,
        tip: "Put this item in checked baggage.",
        facts: [`Entered volume: ${volume} ml`],
      };
    }

    case "knife":
    case "tool": {
      const cm = Number(answers.bladeCm || 0);
      if (cm > 6) {
        return {
          hand: { ...no, note: "Over 6 cm: only in checked baggage." },
          checked: yes,
          tip: "Pack safely in checked baggage.",
          facts: [`Length entered: ${cm} cm`],
        };
      }
      return {
        hand: { status: "allowed", note: "Up to 6 cm can be accepted in hand baggage." },
        checked: yes,
        tip: "Final decision remains with security staff.",
        facts: [`Length entered: ${cm} cm`],
      };
    }

    case "lighter": {
      const onPerson = answers.onPerson === true;
      return {
        hand: { ...no, note: "Not allowed in hand baggage." },
        checked: { ...no, note: "Not allowed in checked baggage." },
        tip: onPerson ? "One lighter OR one box of matches is allowed only on your person." : "Carry one lighter/matches on your person only, not in baggage.",
        facts: ["Quantity policy: one item on person only."],
      };
    }

    case "ecig":
      return {
        hand: { status: "conditional", note: "Allowed in hand baggage only." },
        checked: { ...no, note: "Not allowed in checked baggage." },
        tip: "Keep e-cigarettes in hand baggage and protect from accidental activation.",
        facts: [],
      };

    case "smart_luggage":
      if (answers.batteryType === "fixed") {
        return {
          hand: { ...no, note: "Smart luggage with permanently installed lithium battery is not permitted." },
          checked: { ...no, note: "Smart luggage with permanently installed lithium battery is not permitted." },
          tip: "Use luggage with removable battery.",
          facts: [],
        };
      }
      return {
        hand: { status: "conditional", note: "Remove lithium battery and carry it as a spare battery in hand baggage." },
        checked: { status: "conditional", note: "Luggage can be checked only after battery removal." },
        tip: "Follow spare-battery limitations after removal.",
        facts: [],
      };

    case "blunt":
      return {
        hand: { ...no, note: "Blunt objects are not allowed in hand baggage." },
        checked: yes,
        tip: "Transport in checked baggage.",
        facts: [],
      };

    case "prohibited":
      return {
        hand: { ...no, note: "Prohibited in all baggage." },
        checked: { ...no, note: "Prohibited in all baggage." },
        tip: "Do not bring this item to the airport.",
        facts: ["Examples: fireworks, fuel pastes, gas cartridges, acids, corrosives."],
      };

    case "electronics":
      return {
        hand: yes,
        checked: yes,
        tip: "At security, place large electronic devices separately in a tray.",
        facts: [],
      };

    default:
      return { hand: yes, checked: yes, tip: "", facts: [] };
  }
}

function App() {
  const [screen, setScreen] = useState("home");
  const [photo, setPhoto] = useState(null);
  const [itemName, setItemName] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("scanHistoryV2") || "[]"));
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const selectedCategory = DB.item_categories.find((c) => c.id === categoryId);
  const questions = DB.item_questions[categoryId] || [];
  const result = categoryId ? evaluate(categoryId, answers) : null;

  useEffect(() => {
    localStorage.setItem("scanHistoryV2", JSON.stringify(history));
  }, [history]);

  const startFlow = () => {
    setScreen("camera");
    setPhoto(null);
    setItemName("");
    setCategoryId(null);
    setAnswers({});
  };

  const saveScan = () => {
    if (!selectedCategory || !result) return;
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      itemName: itemName || selectedCategory.label,
      categoryId,
      categoryLabel: selectedCategory.label,
      answers,
      result,
      photo,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 30));
  };

  const selectedHistory = history.find((h) => h.id === selectedHistoryId);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-lg mx-auto p-4 pb-12">
        <header className="mb-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">ZRH Baggage Checker</h1>
            <span className="text-xs px-2 py-1 bg-slate-200 rounded-full">Prototype</span>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Rules apply to departures from Zurich Airport. Your airline may be stricter.
          </p>
        </header>

        {screen === "home" && (
          <HomeScreen
            history={history}
            onStart={startFlow}
            onOpenHistory={(id) => {
              setSelectedHistoryId(id);
              setScreen("history");
            }}
          />
        )}

        {screen === "camera" && (
          <CameraScreen
            photo={photo}
            setPhoto={setPhoto}
            onSkip={() => setScreen("identify")}
            onContinue={() => setScreen("identify")}
          />
        )}

        {screen === "identify" && (
          <IdentifyScreen
            categories={DB.item_categories}
            itemName={itemName}
            setItemName={setItemName}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            photo={photo}
            onBack={() => setScreen("camera")}
            onContinue={() => setScreen(questions.length ? "wizard" : "result")}
          />
        )}

        {screen === "wizard" && (
          <WizardScreen
            category={selectedCategory}
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
            onBack={() => setScreen("identify")}
            onContinue={() => setScreen("result")}
          />
        )}

        {screen === "result" && result && selectedCategory && (
          <ResultScreen
            category={selectedCategory}
            result={result}
            answers={answers}
            onSave={saveScan}
            onBack={() => setScreen(questions.length ? "wizard" : "identify")}
            onRestart={() => setScreen("home")}
          />
        )}

        {screen === "history" && selectedHistory && (
          <HistoryDetailScreen
            entry={selectedHistory}
            onBack={() => setScreen("home")}
            onDelete={() => {
              setHistory((prev) => prev.filter((x) => x.id !== selectedHistory.id));
              setScreen("home");
            }}
          />
        )}
      </div>
    </main>
  );
}

function HomeScreen({ history, onStart, onOpenHistory }) {
  const stats = useMemo(() => {
    let allowed = 0;
    let restricted = 0;
    for (const h of history) {
      if (h.result.hand.status === "allowed" && h.result.checked.status === "allowed") allowed += 1;
      else restricted += 1;
    }
    return { allowed, restricted };
  }, [history]);

  return (
    <section className="space-y-4">
      <button onClick={onStart} className="w-full rounded-xl bg-slate-900 text-white py-4 text-lg font-semibold shadow">
        Scan an item
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-slate-500">Scans with fully allowed verdict</div>
          <div className="text-2xl font-bold mt-1 text-green-700">{stats.allowed}</div>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="text-xs text-slate-500">Scans with restrictions</div>
          <div className="text-2xl font-bold mt-1 text-amber-700">{stats.restricted}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-3">
        <h2 className="font-semibold">Official source pages</h2>
        <ul className="mt-2 list-disc ml-5 text-xs text-slate-600 space-y-1 break-all">
          {DB.rule_sources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold mb-2">Recent scans</h2>
        <div className="space-y-2">
          {history.length === 0 && <div className="text-sm text-slate-500">No scan history yet.</div>}
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => onOpenHistory(entry.id)}
              className="w-full text-left bg-white border rounded-lg p-3 hover:border-slate-400"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{entry.itemName}</div>
                  <div className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLE[entry.result.hand.status]}`}>
                  Hand: {statusLabel(entry.result.hand.status)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CameraScreen({ photo, setPhoto, onSkip, onContinue }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera is unavailable. You can continue without a photo."));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">1) Capture item photo (optional)</h2>
      <div className="relative h-80 rounded-xl bg-black overflow-hidden border border-slate-700">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-8 border-2 border-white/80 rounded-2xl pointer-events-none" />
        <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded">Place item inside frame</div>
      </div>

      {error && <p className="text-sm text-amber-700">{error}</p>}

      {photo && <img src={photo} alt="Captured item" className="w-24 h-24 rounded-lg object-cover border" />}

      <div className="grid grid-cols-3 gap-2">
        <button onClick={takePhoto} className="rounded-lg bg-slate-900 text-white py-2">Capture</button>
        <button onClick={() => setPhoto(null)} className="rounded-lg border py-2">Clear</button>
        <button onClick={onContinue} className="rounded-lg border py-2">Next</button>
      </div>
      <button onClick={onSkip} className="text-sm underline text-slate-700">No camera / skip photo</button>
    </section>
  );
}

function IdentifyScreen({ categories, itemName, setItemName, categoryId, setCategoryId, photo, onBack, onContinue }) {
  const [query, setQuery] = useState(itemName || "");

  const suggestedId = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    for (const c of categories) {
      if (c.keywords.some((k) => q.includes(k))) return c.id;
    }
    return null;
  }, [query, categories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q)));
  }, [query, categories]);

  useEffect(() => {
    if (!categoryId && suggestedId) setCategoryId(suggestedId);
  }, [suggestedId, categoryId, setCategoryId]);

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">2) Identify the item</h2>
      {photo && <img src={photo} alt="Reference" className="w-20 h-20 rounded-lg border object-cover" />}

      <div className="bg-white border rounded-lg p-3 space-y-2">
        <label className="text-sm font-medium">Item name (optional)</label>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setItemName(e.target.value);
          }}
          placeholder="e.g., power bank, shampoo, screwdriver"
          className="w-full rounded-lg border p-2"
        />
        {suggestedId && (
          <p className="text-xs text-slate-600">
            Suggested category based on text: <strong>{categories.find((c) => c.id === suggestedId)?.label}</strong>
          </p>
        )}
      </div>

      <div className="space-y-2 max-h-72 overflow-auto">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryId(cat.id)}
            className={`w-full text-left rounded-lg border p-3 ${categoryId === cat.id ? "bg-slate-900 text-white border-slate-900" : "bg-white"}`}
          >
            <div className="font-medium text-sm">{cat.label}</div>
            <div className="text-xs opacity-75">{cat.group}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onBack} className="rounded-lg border py-2">Back</button>
        <button disabled={!categoryId} onClick={onContinue} className="rounded-lg bg-slate-900 text-white py-2 disabled:opacity-40">Continue</button>
      </div>
    </section>
  );
}

function WizardScreen({ category, questions, answers, setAnswers, onBack, onContinue }) {
  const [step, setStep] = useState(0);
  const current = questions[step];

  const value = current ? answers[current.key] : undefined;
  const isValid = !current?.required || (current.type === "boolean" ? typeof value === "boolean" : value !== undefined && value !== "");

  const update = (newValue) => {
    setAnswers((prev) => ({ ...prev, [current.key]: newValue }));
  };

  if (!category || questions.length === 0) {
    return (
      <section className="space-y-3">
        <p className="text-sm text-slate-600">No additional questions required for this category.</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onBack} className="rounded-lg border py-2">Back</button>
          <button onClick={onContinue} className="rounded-lg bg-slate-900 text-white py-2">See result</button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="font-semibold">3) Details for {category.label}</h2>
      <div className="text-xs text-slate-600">Step {step + 1} of {questions.length}</div>
      <div className="h-2 bg-slate-200 rounded">
        <div className="h-2 bg-slate-900 rounded" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white border rounded-lg p-3 space-y-2">
        <label className="text-sm font-medium">{current.label}</label>

        {current.type === "number" && (
          <input
            type="number"
            min={current.min}
            step={current.step || "1"}
            value={value ?? ""}
            onChange={(e) => update(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        )}

        {current.type === "select" && (
          <select
            value={value ?? ""}
            onChange={(e) => update(e.target.value)}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select an option</option>
            {current.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {current.type === "boolean" && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => update(true)} className={`rounded-lg border py-2 ${value === true ? "bg-slate-900 text-white" : "bg-white"}`}>Yes</button>
            <button onClick={() => update(false)} className={`rounded-lg border py-2 ${value === false ? "bg-slate-900 text-white" : "bg-white"}`}>No</button>
          </div>
        )}
      </div>

      {category.id === "battery" && answers.mah && answers.voltage && (
        <div className="text-sm bg-white border rounded-lg p-3">
          Calculated energy: <strong>{((Number(answers.mah) * Number(answers.voltage)) / 1000).toFixed(1)} Wh</strong>
          <div className="text-xs text-slate-500">Formula: Wh = mAh × V / 1000</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => (step === 0 ? onBack() : setStep((s) => s - 1))} className="rounded-lg border py-2">Back</button>
        {step < questions.length - 1 ? (
          <button disabled={!isValid} onClick={() => setStep((s) => s + 1)} className="rounded-lg border py-2 disabled:opacity-40">Next</button>
        ) : (
          <button disabled={!isValid} onClick={onContinue} className="rounded-lg bg-slate-900 text-white py-2 disabled:opacity-40">See result</button>
        )}
        <button onClick={onContinue} className="rounded-lg border py-2">Skip</button>
      </div>
    </section>
  );
}

function ResultScreen({ category, result, answers, onSave, onBack, onRestart }) {
  useEffect(() => {
    onSave();
  }, []);

  return (
    <section className="space-y-4">
      <h2 className="font-semibold">4) Verdict for {category.label}</h2>

      <div className={`border rounded-lg p-3 ${STATUS_STYLE[result.hand.status]}`}>
        <div className="text-sm font-semibold">Hand baggage — {statusLabel(result.hand.status)}</div>
        <div className="text-sm mt-1">{result.hand.note}</div>
      </div>

      <div className={`border rounded-lg p-3 ${STATUS_STYLE[result.checked.status]}`}>
        <div className="text-sm font-semibold">Checked baggage — {statusLabel(result.checked.status)}</div>
        <div className="text-sm mt-1">{result.checked.note}</div>
      </div>

      <div className="bg-white border rounded-lg p-3 text-sm">
        <strong>What to do:</strong> {result.tip}
      </div>

      {result.facts?.length > 0 && (
        <div className="bg-white border rounded-lg p-3">
          <div className="font-medium text-sm">Decision facts</div>
          <ul className="list-disc ml-5 mt-2 text-xs text-slate-600 space-y-1">
            {result.facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-white border rounded-lg p-3">
        <div className="font-medium text-sm">Answers used</div>
        <pre className="text-xs text-slate-700 mt-2 whitespace-pre-wrap">{JSON.stringify(answers, null, 2)}</pre>
      </div>

      <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-xs text-slate-700">
        This result is an informational aid. Final authority: Zurich Airport security and your airline.
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onBack} className="rounded-lg border py-2">Back</button>
        <button onClick={onRestart} className="rounded-lg bg-slate-900 text-white py-2">Check another item</button>
      </div>
    </section>
  );
}

function HistoryDetailScreen({ entry, onBack, onDelete }) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Scan record detail</h2>
      <div className="bg-white border rounded-lg p-3 space-y-1 text-sm">
        <div><strong>Item:</strong> {entry.itemName}</div>
        <div><strong>Category:</strong> {entry.categoryLabel}</div>
        <div><strong>Date:</strong> {new Date(entry.timestamp).toLocaleString()}</div>
      </div>

      {entry.photo && <img src={entry.photo} alt="Saved scan" className="w-28 h-28 rounded-lg border object-cover" />}

      <div className={`border rounded-lg p-3 ${STATUS_STYLE[entry.result.hand.status]}`}>
        <div className="font-semibold text-sm">Hand baggage</div>
        <div className="text-sm">{entry.result.hand.note}</div>
      </div>
      <div className={`border rounded-lg p-3 ${STATUS_STYLE[entry.result.checked.status]}`}>
        <div className="font-semibold text-sm">Checked baggage</div>
        <div className="text-sm">{entry.result.checked.note}</div>
      </div>

      <div className="bg-white border rounded-lg p-3">
        <div className="font-medium text-sm">Answers</div>
        <pre className="text-xs text-slate-700 mt-2 whitespace-pre-wrap">{JSON.stringify(entry.answers, null, 2)}</pre>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onBack} className="rounded-lg border py-2">Back</button>
        <button onClick={onDelete} className="rounded-lg bg-red-600 text-white py-2">Delete record</button>
      </div>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
