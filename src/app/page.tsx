import Image from "next/image";
import styles from "./page.module.css";
import bgImage from "@/app/assets/background_img.jpg";
import {
  Mic,
  BarChart3,
  Globe,
  Upload,
  Share2,
  Headphones,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Unlimited Hosting",
    desc: "Upload hours of content with no storage limits. High-quality audio preserved.",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    desc: "Track listens, demographics, and engagement with real-time dashboard insights.",
  },
  {
    icon: Globe,
    title: "Global Distribution",
    desc: "Publish to Spotify, Apple Podcasts, Google, and 20+ platforms with one click.",
  },
  {
    icon: Mic,
    title: "Studio-Quality Recording",
    desc: "Record and edit directly in your browser with built-in professional tools.",
  },
  {
    icon: Share2,
    title: "Smart Monetization",
    desc: "Earn from ads, sponsorships, and listener subscriptions — all in one place.",
  },
  {
    icon: Headphones,
    title: "Listener Community",
    desc: "Build a dedicated audience with comments, polls, and exclusive content.",
  },
];

const steps = [
  { num: "01", title: "Create Your Show", desc: "Set up your podcast in minutes. Add artwork, description, and your unique voice." },
  { num: "02", title: "Upload & Edit", desc: "Drag, drop, and polish your episodes with our web-based audio editor." },
  { num: "03", title: "Publish Everywhere", desc: "Distribute to all major platforms automatically. Reach listeners worldwide." },
  { num: "04", title: "Grow & Earn", desc: "Track performance, engage your audience, and turn your passion into revenue." },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>StellarCast</span>
        </div>
        <nav className={styles.nav}>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#cta" className={styles.navCta}>Get Started</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <Image
          src={bgImage}
          alt=""
          fill
          preload
          style={{ objectFit: "cover" }}
        />
        <div className={styles.overlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>The Podcast Platform</span>
          <h1 className={styles.heroTitle}>
            Your Voice,{" "}
            <span className={styles.gradientText}>The Universe</span> Listens
          </h1>
          <p className={styles.heroSubtitle}>
            Create, distribute, and grow your podcast with StellarCast. 
            Professional tools, unlimited hosting, and a global audience waiting for you.
          </p>
          <div className={styles.heroButtons}>
            <a href="#cta" className={styles.primaryBtn}>Start Your Journey</a>
            <a href="#features" className={styles.secondaryBtn}>Explore Features</a>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>50K+</span>
              <span className={styles.statLabel}>Podcasters</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>2M+</span>
              <span className={styles.statLabel}>Episodes</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>190+</span>
              <span className={styles.statLabel}>Countries</span>
            </div>
          </div>
        </div>
        <div className={styles.scrollIndicator}>
          <span>Scroll to explore</span>
          <div className={styles.scrollArrow} />
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Why StellarCast</span>
          <h2 className={styles.sectionTitle}>
            Everything You Need to <span className={styles.gradientText}>Shine</span>
          </h2>
          <p className={styles.sectionDesc}>
            From recording to monetization, we provide the tools to turn your podcast into a success story.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon size={28} />
                </div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureDesc}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Simple Process</span>
          <h2 className={styles.sectionTitle}>
            Start in <span className={styles.gradientText}>4 Steps</span>
          </h2>
          <p className={styles.sectionDesc}>
            Getting your podcast online has never been easier.
          </p>
        </div>
        <div className={styles.stepsGrid}>
          {steps.map((step, i) => (
            <div key={step.num} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.num}</div>
              <div className={styles.stepConnector}>
                {i < steps.length - 1 && <div className={styles.connectorLine} />}
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="cta" className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Ready to Launch Your Podcast?
          </h2>
          <p className={styles.ctaDesc}>
            Join thousands of podcasters who trust StellarCast. Start free, upgrade when you grow.
          </p>
          <div className={styles.ctaButtons}>
            <a href="#" className={styles.primaryBtn}>Get Started Free</a>
            <a href="#" className={styles.secondaryBtn}>View Pricing</a>
          </div>
          <p className={styles.ctaFootnote}>No credit card required • Cancel anytime</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.footerLogoText}>StellarCast</span>
            <p className={styles.footerDesc}>
              Empowering voices to reach the stars.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Integrations</a>
              <a href="#">Changelog</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Resources</h4>
              <a href="#">Blog</a>
              <a href="#">Help Center</a>
              <a href="#">Community</a>
              <a href="#">API Docs</a>
            </div>
            <div className={styles.footerCol}>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 StellarCast. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
