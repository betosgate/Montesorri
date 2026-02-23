import Link from 'next/link';

const features = [
  {
    title: '180 Days of Curriculum',
    description:
      'A complete, sequenced Montessori curriculum for each grade band, organized by week with daily lesson plans.',
  },
  {
    title: 'Weekly Live Classes',
    description:
      'Small-group Zoom sessions led by certified Montessori teachers, giving your child real classroom connection.',
  },
  {
    title: 'Progress Tracking',
    description:
      'Detailed mastery tracking aligned to scope and sequence, so you always know where your child stands.',
  },
  {
    title: 'Interactive Lessons',
    description:
      'Step-by-step guided lessons with materials lists, parent notes, and age-appropriate adaptations.',
  },
  {
    title: 'Five Great Lessons',
    description:
      'The cornerstone Montessori narratives brought to life with demonstrations, follow-up work, and rich storytelling.',
  },
  {
    title: 'Parent Community',
    description:
      'Connect with other Montessori homeschool families through forums, shared resources, and group support.',
  },
];

const pricingFeatures = [
  'Full 180-day curriculum access',
  'Weekly live Zoom classes',
  'Progress and mastery tracking',
  'Interactive lesson slides',
  'Parent community forums',
  'Teacher observations and feedback',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Public header */}
      <header className="border-b border-stone-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-semibold text-stone-800">
            Montessori Homeschool
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-800 sm:text-5xl">
          Complete Montessori Curriculum,
          <br />
          <span className="text-green-700">Delivered to Your Home</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-500">
          A full K-6 Montessori program with daily lessons, weekly live classes,
          progress tracking, and a supportive parent community — everything you
          need to homeschool the Montessori way.
        </p>
        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-block rounded-md bg-green-700 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-green-800"
          >
            Start for $50/mo
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-stone-100 bg-stone-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-stone-800">
            Everything You Need
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-stone-500">
            A thoughtfully designed platform built around authentic Montessori
            principles.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-stone-200 bg-white p-6"
              >
                <h3 className="text-base font-semibold text-stone-800">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-stone-800">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-stone-500">
            One plan with everything included. No hidden fees, no upsells.
          </p>

          <div className="mx-auto mt-12 max-w-md rounded-lg border border-stone-200 bg-white p-8 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-stone-400">
              Per Student
            </p>
            <p className="mt-2 text-4xl font-bold text-stone-800">
              $50
              <span className="text-lg font-normal text-stone-400">
                /month
              </span>
            </p>
            <ul className="mt-8 space-y-3 text-left">
              {pricingFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm text-stone-600"
                >
                  <span className="mt-0.5 text-green-700">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-block w-full rounded-md bg-green-700 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-800"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm text-stone-400">
            &copy; {new Date().getFullYear()} Montessori Homeschool. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
