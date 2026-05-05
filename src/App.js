import React, { useState, useEffect } from "react";

const ORDER = ["vorbereitungen", "ausmass", "ausfuehrungsplanung", "materialauszug"];
const LABELS = {
  vorbereitungen: "Vorbereitungen",
  ausmass: "Ausmass",
  ausfuehrungsplanung: "Ausfuehrungsplanung",
  materialauszug: "Materialauszug"
};

function createProject(name, date) {
  return {
    id: Math.random().toString(36).slice(2),
    name,
    date,
    open: false,
    checklist: {
      vorbereitungen: [
        { name: "Waende bis Platten fertig", done: false },
        { name: "Hauptlueftung montiert", done: false },
        { name: "Boden fertig", done: false },
        { name: "Elektrotrassen montiert", done: false },
        { name: "Termin 4-5 Wochen bestaetigt", done: false }
      ],
      ausmass: [{ name: "Ausmass durchgefuehrt", done: false }],
      ausfuehrungsplanung: [
        { name: "Ausfuehrungsplanung erstellt", done: false },
        { name: "GZA erhalten (Freigabe)", done: false }
      ],
      materialauszug: [{ name: "Materialauszug erstellt", done: false }]
    }
  };
}

function getProgress(p) {
  let total = 0, done = 0;
  Object.values(p.checklist).forEach(s => s.forEach(i => { total++; if (i.done) done++; }));
  return Math.round((done / total) * 100);
}

function getStatus(p) {
  const pr = getProgress(p);
  if (pr === 100) return { label: "Bereit zur Ausfuehrung", cls: "bereit" };
  if (pr > 75) return { label: "Materialauszug Phase", cls: "material" };
  if (pr > 50) return { label: "Ausfuehrungsplanung", cls: "planung" };
  if (pr > 25) return { label: "Ausmass Phase", cls: "ausmass" };
  return { label: "Vorbereitung", cls: "vorbereitung" };
}

function getWarning(p) {
  const now = new Date();
  const diff = (new Date(p.date) - now) / (1000 * 60 * 60 * 24);
  const { label } = getStatus(p);
  if (diff <= 28 && diff > 14) {
    if (label === "Vorbereitung") return "Zeit fuers Ausmass";
    if (label.includes("Ausmass")) return "Ausmass erledigen";
    if (label.includes("Planung")) return "Planung abschliessen";
  }
  if (diff <= 14 && label !== "Bereit zur Ausfuehrung") return "Kritische Phase!";
  return "";
}

function getColor(pr) {
  if (pr === 100) return "#16a34a";
  if (pr > 60) return "#ea580c";
  return "#dc2626";
}

const STATUS_STYLES = {
  vorbereitung: { background: "#f1f5f9", color: "#475569" },
  ausmass: { background: "#eff6ff", color: "#2563eb" },
  planung: { background: "#ffedd5", color: "#ea580c" },
  material: { background: "#faf5ff", color: "#7c3aed" },
  bereit: { background: "#dcfce7", color: "#16a34a" }
};

export default function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("projekte_v3");
      if (saved) {
        const parsed = JSON.parse(saved);
        setProjects(parsed.map(p => ({
          ...p,
          date: typeof p.date === "string" ? p.date.slice(0, 10) : new Date(p.date).toISOString().slice(0, 10)
        })));
      }
    } catch (e) { setProjects([]); }
  }, []);

  useEffect(() => {
    localStorage.setItem("projekte_v3", JSON.stringify(projects));
  }, [projects]);

  function addProject() {
    if (!name || !date) return;
    setProjects(prev => [...prev, createProject(name, date)]);
    setName(""); setDate("");
  }

  function deleteProject(id) { setProjects(prev => prev.filter(p => p.id !== id)); }
  function toggleOpen(id) { setProjects(prev => prev.map(p => p.id === id ? { ...p, open: !p.open } : p)); }
  function updateDate(id, newDate) { setProjects(prev => prev.map(p => p.id === id ? { ...p, date: newDate } : p)); }

  function toggleItem(id, section, index) {
    setProjects(prev => prev.map(p => {
      if (p.id !== id) return p;
      const idx = ORDER.indexOf(section);
      for (let i = 0; i < idx; i++) {
        if (!p.checklist[ORDER[i]].every(x => x.done)) return p;
      }
      const updated = { ...p, checklist: { ...p.checklist } };
      updated.checklist[section] = updated.checklist[section].map((item, i) =>
        i === index ? { ...item, done: !item.done } : item
      );
      return updated;
    }));
  }

  const sorted = [...projects].sort((a, b) => new
