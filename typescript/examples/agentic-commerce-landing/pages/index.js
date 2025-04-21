import Head from 'next/head'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEnrollClick = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseName: 'Mastering Agentic Commerce',
          price: '199.00'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const data = await response.json();
      
      // Redirect to the payment link
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error('Error creating payment:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Mastering Agentic Commerce | The Ultimate Course</title>
        <meta name="description" content="Learn how to leverage AI agents for e-commerce success. Master the tools and techniques of agentic commerce." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.navbar}>
          <div className={styles.logo}>
            <h2>Agentic Commerce</h2>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className={`${styles.hero} section`}>
          <div className="container">
            <div className={styles.heroContent}>
              <h1 className={styles.title}>
                Master the Future of E-Commerce with <span className={styles.highlight}>AI Agents</span>
              </h1>
              <p className={styles.description}>
                Discover how to leverage AI-powered agents to revolutionize your business. Stay ahead of the curve in the rapidly evolving world of commerce.
              </p>
              <button
                onClick={handleEnrollClick}
                disabled={isLoading}
                className={`button ${styles.ctaButton}`}
              >
                {isLoading ? 'Processing...' : 'Enroll Now - $199'}
              </button>
              {error && <p className={styles.errorMessage}>{error}</p>}
              <p className={styles.guarantee}>30-Day Money-Back Guarantee</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={`${styles.features} section`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>What You'll Learn</h2>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <h3>AI Agent Fundamentals</h3>
                <p>Understand how AI agents work and how they can be applied to e-commerce workflows.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>Advanced Integration Techniques</h3>
                <p>Learn to integrate payment processing systems with AI agents for seamless transactions.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>Customer Experience Automation</h3>
                <p>Create personalized shopping experiences using agentic technologies.</p>
              </div>
              <div className={styles.featureCard}>
                <h3>Real-world Case Studies</h3>
                <p>Analyze successful implementations and learn from industry leaders.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className={`${styles.pricing} section`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Invest in Your Future</h2>
            <div className={styles.pricingBox}>
              <h3>Complete Agentic Commerce Mastery</h3>
              <ul className={styles.pricingFeatures}>
                <li>6 comprehensive modules</li>
                <li>24+ hours of video content</li>
                <li>Practical exercises and templates</li>
                <li>Private community access</li>
                <li>Certificate of completion</li>
                <li>Lifetime updates</li>
              </ul>
              <div className={styles.price}>
                <span className={styles.amount}>$199</span>
                <span className={styles.oneTime}>one-time payment</span>
              </div>
              <button
                onClick={handleEnrollClick}
                disabled={isLoading}
                className={`button ${styles.enrollButton}`}
              >
                {isLoading ? 'Processing...' : 'Enroll Now'}
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className={`${styles.testimonials} section`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Success Stories</h2>
            <div className={styles.testimonialGrid}>
              <div className={styles.testimonialCard}>
                <p>"This course transformed my business. Our conversion rates increased by 45% after implementing the AI agent strategies taught here."</p>
                <div className={styles.testimonialAuthor}>
                  <span>Sarah J.</span>
                  <span>E-commerce Director</span>
                </div>
              </div>
              <div className={styles.testimonialCard}>
                <p>"The technical insights were invaluable. I was able to integrate an AI agent payment system in just one week thanks to this comprehensive training."</p>
                <div className={styles.testimonialAuthor}>
                  <span>David L.</span>
                  <span>Developer</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className={`${styles.faq} section`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqGrid}>
              <div className={styles.faqItem}>
                <h3>Do I need technical experience?</h3>
                <p>While some technical background is helpful, the course is designed to accommodate various skill levels.</p>
              </div>
              <div className={styles.faqItem}>
                <h3>How long do I have access?</h3>
                <p>You'll have lifetime access to the course materials, including all future updates.</p>
              </div>
              <div className={styles.faqItem}>
                <h3>Is there support available?</h3>
                <p>Yes, you'll have access to our community forum and bi-weekly Q&A sessions.</p>
              </div>
              <div className={styles.faqItem}>
                <h3>Can I get a refund if I'm not satisfied?</h3>
                <p>Absolutely! We offer a 30-day money-back guarantee with no questions asked.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className={`${styles.finalCta} section`}>
          <div className="container">
            <h2 className={styles.finalCtaTitle}>Ready to Transform Your Business?</h2>
            <p className={styles.finalCtaText}>Join thousands of successful businesses leveraging AI agents for growth</p>
            <button
              onClick={handleEnrollClick}
              disabled={isLoading}
              className={`button ${styles.finalCtaButton}`}
            >
              {isLoading ? 'Processing...' : 'Enroll Now - $199'}
            </button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Agentic Commerce. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}