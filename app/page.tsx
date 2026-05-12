import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Car,
  ClipboardCheck,
  LayoutDashboard,
  Route,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    title: "Smart Vehicle Requests",
    description:
      "Staff can submit structured transport requests with destination, purpose, passenger count, and timing.",
    icon: ClipboardCheck,
  },
  {
    title: "AI Decision Support",
    description:
      "Get estimated trip duration, vehicle recommendations, and operational insights before allocation.",
    icon: Brain,
  },
  {
    title: "Fleet Visibility",
    description:
      "Track assigned and pool vehicles, current availability, trip schedules, and return timelines.",
    icon: Car,
  },
  {
    title: "Approval Workflow",
    description:
      "Manage requests through a clear approval chain from staff to approvers and transport administrators.",
    icon: ShieldCheck,
  },
  {
    title: "Trip Monitoring",
    description:
      "Monitor departure, return, delays, and trip outcomes with a clean operational dashboard.",
    icon: Route,
  },
  {
    title: "Admin Control Center",
    description:
      "A centralized workspace for allocations, driver assignment, reporting, and fleet management.",
    icon: LayoutDashboard,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                Nile Fleet AI
              </p>
              <p className="text-xs text-slate-500">
                Intelligent Transport Operations Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(30,64,175,0.08),_transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <Brain className="h-3.5 w-3.5" />
              AI-Assisted Fleet Management
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Smarter fleet operations for Nile University.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Automate vehicle requests, approvals, allocation, trip tracking,
              and AI-supported transport decisions in one modern, secure
              platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["Role-Based", "Access Control"],
                ["AI", "Decision Support"],
                ["Real-Time", "Fleet Visibility"],
              ].map(([top, bottom]) => (
                <div
                  key={top}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">{top}</p>
                  <p className="mt-1 text-xs text-slate-500">{bottom}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      AI Transport Overview
                    </p>
                    <p className="text-xs text-slate-500">
                      Operational insights for transport administration
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Active
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Estimated Duration
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      1h 35m
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Abuja campus to external official duty route
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Recommended Vehicle
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      Mid-Size SUV
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Based on distance, passenger count, and trip purpose
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Pending Approvals
                        </p>
                        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                          08 Requests
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        Needs Review
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[
                        "Transport requests are routed by unit and approval stage.",
                        "Assigned and pool vehicles are evaluated separately.",
                        "Late return risks are flagged for administrative review.",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                          <p className="text-sm text-slate-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-700">Core Features</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Built for institutional fleet control and growth.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Designed for university transport operations with clean workflows,
            intelligent recommendations, and scalable administrative control.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-slate-900 px-8 py-10 text-white shadow-xl shadow-slate-300/30 lg:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-blue-200">
                Ready for deployment
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                A modern transport platform for real operational use.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                From request submission to trip completion, Nile Fleet AI
                supports secure workflows, scalable data management, and
                explainable AI-driven insights.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Launch Platform
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}