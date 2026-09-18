"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
export function LabTrend({ points }: { points: { date: string; value: number; label: string }[] }) {
  if (!points.length) return <p className="text-sm text-slate-500">No lab points with values.</p>;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer><LineChart data={points}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#0b6363" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
    </div>
  );
}