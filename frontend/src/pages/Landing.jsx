import { Link } from 'react-router-dom'
import styles from './Landing.module.css'

const FEATURES = [
  {
    icon: '⚡',
    title: 'Presupuestos en segundos',
    desc: 'Elegís los servicios, ponés cantidades y el total se calcula solo. Sin Excel, sin calculadora.',
  },
  {
    icon: '📋',
    title: 'Catálogo de servicios',
    desc: 'Cargá tus servicios una sola vez y usálos en cualquier presupuesto. Ahorras tiempo en cada cotización.',
  },
  {
    icon: '👥',
    title: 'Clientes organizados',
    desc: 'Guardá tus contactos con email y WhatsApp. Accedé al historial de presupuestos de cada cliente.',
  },
  {
    icon: '📱',
    title: 'Compartí al instante',
    desc: 'Enviá el presupuesto por WhatsApp, por email o generá un PDF profesional con un solo click.',
  },
  {
    icon: '📅',
    title: 'Control de cobros y pagos',
    desc: 'Registrá vencimientos, llevá el seguimiento de lo que te deben y lo que tenés que pagar.',
  },
  {
    icon: '📊',
    title: 'Historial completo',
    desc: 'Seguí el estado de cada presupuesto: borrador, enviado, aceptado o rechazado.',
  },
]

function LogoIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#344152" />
      <circle cx="32" cy="29" r="16" fill="none" stroke="#F3F1EC" strokeWidth="7" />
      <line x1="43" y1="40" x2="53" y2="50" stroke="#BA683C" strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="29" r="5" fill="#BA683C" />
    </svg>
  )
}

function LogoIconLight({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#F3F1EC" fillOpacity="0.15" />
      <circle cx="32" cy="29" r="16" fill="none" stroke="#F3F1EC" strokeWidth="7" />
      <line x1="43" y1="40" x2="53" y2="50" stroke="#BA683C" strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="29" r="5" fill="#BA683C" />
    </svg>
  )
}

export default function Landing() {
  return (
    <div className={styles.page}>

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <LogoIcon size={36} />
            <span className={styles.navBrand}>Quota</span>
          </div>
          <div className={styles.navActions}>
            <Link to="/login" className={styles.btnGhost}>Iniciar sesión</Link>
            <Link to="/register" className={styles.btnNavCta}>Probá gratis</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>30 días gratis · Sin tarjeta de crédito</div>
          <h1 className={styles.heroTitle}>
            Presupuestos profesionales<br />
            <span className={styles.heroAccent}>en minutos</span>
          </h1>
          <p className={styles.heroSub}>
            Quota es la herramienta para emprendedores y PYMEs que quieren cotizar
            rápido, seguir sus cobros y verse profesionales ante cada cliente.
          </p>
          <div className={styles.heroActions}>
            <Link to="/register" className={styles.btnHeroCta}>Empezá gratis ahora</Link>
            <Link to="/login" className={styles.btnHeroGhost}>Ya tengo cuenta</Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.mockCard}>
            <div className={styles.mockHeader}>
              <div className={styles.mockNum}>Presupuesto #042</div>
              <div className={styles.mockBadge}>Enviado</div>
            </div>
            <div className={styles.mockClient}>Cliente: Martín Gómez</div>
            <div className={styles.mockItems}>
              <div className={styles.mockItem}>
                <span>Diseño de marca</span><span>$ 80.000</span>
              </div>
              <div className={styles.mockItem}>
                <span>Manual de identidad</span><span>$ 45.000</span>
              </div>
              <div className={styles.mockItem}>
                <span>Redes sociales (x3)</span><span>$ 36.000</span>
              </div>
            </div>
            <div className={styles.mockDivider} />
            <div className={styles.mockTotal}>
              <span>Total</span><span>$ 161.000</span>
            </div>
            <div className={styles.mockActions}>
              <div className={styles.mockBtn}>WhatsApp</div>
              <div className={styles.mockBtn}>PDF</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section className={styles.features}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Todo lo que necesitás para cotizar mejor</h2>
          <p className={styles.sectionSub}>
            Diseñado para freelancers, agencias y PYMEs.
          </p>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────── */}
      <section className={styles.pricing}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Precios simples y transparentes</h2>
          <p className={styles.sectionSub}>
            Empezá con 30 días de prueba Pro. Sin compromisos.
          </p>
          <div className={styles.pricingGrid}>

            {/* Free */}
            <div className={styles.planCard}>
              <div className={styles.planName}>Free</div>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>Gratis</span>
              </div>
              <p className={styles.planDesc}>Para explorar la herramienta</p>
              <ul className={styles.planFeatures}>
                <li>2 presupuestos</li>
                <li>3 clientes</li>
                <li>5 servicios</li>
                <li>3 vencimientos</li>
                <li>PDF y WhatsApp incluidos</li>
              </ul>
              <Link to="/register" className={styles.btnPlanFree}>Empezar gratis</Link>
            </div>

            {/* Pro */}
            <div className={`${styles.planCard} ${styles.planCardPro}`}>
              <div className={styles.planProBadge}>Más popular</div>
              <div className={styles.planName}>Pro</div>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>U$S 7,99</span>
                <span className={styles.planPer}>/mes</span>
              </div>
              <p className={styles.planAnnual}>o U$S 63,99/año <span className={styles.planSave}>(ahorrás 33%)</span></p>
              <p className={styles.planDesc}>Para trabajar sin límites</p>
              <ul className={styles.planFeatures}>
                <li>Todo ilimitado</li>
                <li>Clientes ilimitados</li>
                <li>Servicios ilimitados</li>
                <li>Vencimientos ilimitados</li>
                <li>Soporte por WhatsApp</li>
                <li>Acceso a funciones futuras</li>
              </ul>
              <Link to="/register" className={styles.btnPlanPro}>Probá 30 días gratis</Link>
            </div>

          </div>
          <p className={styles.pricingNote}>
            ¿Tenés dudas sobre qué plan elegir?{' '}
            <a
              href="https://wa.me/5492215450899?text=Hola!%20Quiero%20saber%20m%C3%A1s%20sobre%20Quota"
              target="_blank"
              rel="noreferrer"
              className={styles.pricingWa}
            >
              Escribinos por WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────── */}
      <section className={styles.ctaFinal}>
        <div className={styles.ctaInner}>
          <LogoIconLight size={52} />
          <h2 className={styles.ctaTitle}>Empezá tu prueba gratis hoy</h2>
          <p className={styles.ctaSub}>
            30 días con todas las funciones Pro. Sin tarjeta de crédito.<br />
            Cancelá cuando quieras.
          </p>
          <Link to="/register" className={styles.btnCtaFinal}>Crear mi cuenta gratis</Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <LogoIcon size={28} />
            <span className={styles.footerBrand}>Quota</span>
            <span className={styles.footerBy}>by Conectarizate</span>
          </div>
          <div className={styles.footerLinks}>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Registrarse</Link>
            <a
              href="https://wa.me/5492215450899"
              target="_blank"
              rel="noreferrer"
            >
              Soporte
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
