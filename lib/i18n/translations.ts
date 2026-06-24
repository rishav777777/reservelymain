export type Lang = 'EN' | 'DE'

// ── Shared ────────────────────────────────────────────────────────────────────

export const footerT = {
  EN: {
    desc:     'Table booking made simple — for guests and restaurants across Europe.',
    discover: 'Discover',
    links: {
      allRestaurants: 'All restaurants',
      forRestaurants: 'For restaurants',
      login:          'Restaurant login',
    },
    legal:    'Legal',
    legalLinks: {
      allDocs:  'All legal documents',
      privacy:  'Privacy Policy',
      cookies:  'Cookie Policy',
      terms:    'Terms of Service',
      impressum: 'Impressum',
    },
    copyright: 'EU-hosted · GDPR compliant',
    email:     'hallo@reservely.app',
  },
  DE: {
    desc:     'Tischreservierungen leicht gemacht – für Gäste und Restaurants in ganz Europa.',
    discover: 'Entdecken',
    links: {
      allRestaurants: 'Alle Restaurants',
      forRestaurants: 'Für Restaurants',
      login:          'Restaurant-Login',
    },
    legal:    'Rechtliches',
    legalLinks: {
      allDocs:   'Alle Rechtsdokumente',
      privacy:   'Datenschutzerklärung',
      cookies:   'Cookie-Richtlinie',
      terms:     'Nutzungsbedingungen',
      impressum: 'Impressum',
    },
    copyright: 'EU-gehostet · DSGVO-konform',
    email:     'hallo@reservely.app',
  },
} as const

// ── Home page ─────────────────────────────────────────────────────────────────

export const homeT = {
  EN: {
    nav: {
      forRestaurants: 'For restaurants',
      login:          'Restaurant login',
    },
    hero: {
      badge:             'Live tables available now',
      title1:            'Find your',
      title2:            'perfect table.',
      subtitle:          'Discover restaurants, see live availability, and book a table in under 2 minutes — no phone calls.',
      searchPlaceholder: 'Restaurant, cuisine, or city…',
      searchButton:      'Search',
      card: {
        guests:     '2 guests',
        tonight:    'Tonight',
        confirmBtn: 'Confirm reservation →',
        confirmed:  'Confirmed!',
        excellent:  'Excellent',
        reviews:    'reviews',
      },
    },
    cuisines: [
      { label: 'Austrian', emoji: '🥩' },
      { label: 'Italian',  emoji: '🍝' },
      { label: 'Sushi',    emoji: '🍣' },
      { label: 'German',   emoji: '🥨' },
      { label: 'Greek',    emoji: '🫒' },
      { label: 'Asian',    emoji: '🍜' },
      { label: 'French',   emoji: '🥐' },
    ],
    stats: [
      { suffix: '+',     label: 'Bookings processed'  },
      { suffix: '+',     label: 'Restaurants listed'  },
      { suffix: '%',     label: 'Confirmation rate'   },
      { display: '<2 min', label: 'Average booking time' },
    ],
    restaurants: {
      eyebrow:  'Restaurants',
      heading:  'Available now',
      viewAll:  'View all',
      empty:    'No restaurants listed yet',
      emptyAdd: 'add your restaurant',
      book:     'Book a table',
      available: 'Available',
    },
    groupEvents: {
      badge:    'Group Events & Private Dining',
      title1:   'Planning something',
      title2:   'special?',
      subtitle: 'Birthday dinners, corporate lunches, wedding receptions, team gatherings — submit a group inquiry and the restaurant will get back to you directly.',
      bullets: [
        '10+ guests — ideal for private group dining',
        'Custom menus — set menu, à la carte, or buffet',
        'Special arrangements — décor, AV, dietary needs',
      ],
      cta: 'Request a group booking',
      eventTypes: [
        { emoji: '🎂', title: 'Birthday',    desc: 'Make it memorable'         },
        { emoji: '💼', title: 'Corporate',   desc: 'Business lunches & events'  },
        { emoji: '💍', title: 'Wedding',     desc: 'Reception & rehearsal'      },
        { emoji: '🥂', title: 'Celebration', desc: 'Any special occasion'       },
      ],
    },
    howItWorks: {
      eyebrow: 'How it works',
      heading: 'Book a table in 3 steps.',
      steps: [
        { title: 'Find a restaurant', body: "Search by name, cuisine, or city. Browse what's available today and tomorrow." },
        { title: 'Choose date & time', body: 'Pick your date, party size, and preferred time. Live availability — no guessing.' },
        { title: 'Confirm & done', body: 'Enter your name, email, phone — accept consent and your booking is confirmed instantly.' },
      ],
      cta: 'Browse all restaurants',
    },
    testimonials: {
      eyebrow: 'What owners say',
      heading: 'Trusted by restaurants across Austria.',
      addCta:  'Add your restaurant',
      items: [
        { name: 'Maria K.', role: 'Owner · Gasthaus Zum Wohl, Vienna',  stars: 5, quote: "Since switching to Reservely, we've cut phone calls by 80%. Guests love booking online and I love not being interrupted during service." },
        { name: 'Thomas R.', role: 'Manager · Trattoria Rosso, Graz',   stars: 5, quote: "The WhatsApp alerts are a game-changer. I see every new booking the second it comes in — even on my day off." },
        { name: 'Sophie L.', role: 'Owner · Café Licht, Salzburg',      stars: 5, quote: "Setup was done in an afternoon. The floor plan view makes it so easy to see what's booked and what's free at a glance." },
      ],
    },
  },

  DE: {
    nav: {
      forRestaurants: 'Für Restaurants',
      login:          'Restaurant-Login',
    },
    hero: {
      badge:             'Tische jetzt sofort verfügbar',
      title1:            'Finden Sie Ihren',
      title2:            'perfekten Tisch.',
      subtitle:          'Entdecken Sie Restaurants, sehen Sie die Echtzeit-Verfügbarkeit und buchen Sie in unter 2 Minuten – ohne Telefon.',
      searchPlaceholder: 'Restaurant, Küche oder Stadt…',
      searchButton:      'Suchen',
      card: {
        guests:     '2 Gäste',
        tonight:    'Heute Abend',
        confirmBtn: 'Reservierung bestätigen →',
        confirmed:  'Bestätigt!',
        excellent:  'Ausgezeichnet',
        reviews:    'Bewertungen',
      },
    },
    cuisines: [
      { label: 'Österreichisch', emoji: '🥩' },
      { label: 'Italienisch',    emoji: '🍝' },
      { label: 'Sushi',          emoji: '🍣' },
      { label: 'Deutsch',        emoji: '🥨' },
      { label: 'Griechisch',     emoji: '🫒' },
      { label: 'Asiatisch',      emoji: '🍜' },
      { label: 'Französisch',    emoji: '🥐' },
    ],
    stats: [
      { suffix: '+',       label: 'Buchungen verarbeitet'      },
      { suffix: '+',       label: 'Eingetragene Restaurants'   },
      { suffix: '%',       label: 'Bestätigungsrate'           },
      { display: '<2 Min', label: 'Ø Buchungszeit'             },
    ],
    restaurants: {
      eyebrow:  'Restaurants',
      heading:  'Jetzt verfügbar',
      viewAll:  'Alle anzeigen',
      empty:    'Noch keine Restaurants eingetragen',
      emptyAdd: 'Restaurant eintragen',
      book:     'Tisch reservieren',
      available: 'Verfügbar',
    },
    groupEvents: {
      badge:    'Gruppenevents & Private Dining',
      title1:   'Etwas Besonderes',
      title2:   'geplant?',
      subtitle: 'Geburtstagsfeiern, Firmenevents, Hochzeiten, Teamtreffen – Senden Sie eine Gruppenanfrage und das Restaurant meldet sich direkt bei Ihnen.',
      bullets: [
        '10+ Gäste – ideal für private Gruppenveranstaltungen',
        'Individuelle Menüs – Menü, à la carte oder Buffet',
        'Sonderarrangements – Dekoration, AV-Ausstattung, Ernährungswünsche',
      ],
      cta: 'Gruppenreservierung anfragen',
      eventTypes: [
        { emoji: '🎂', title: 'Geburtstag',  desc: 'Unvergesslich feiern'          },
        { emoji: '💼', title: 'Firmenevent', desc: 'Business-Lunch & Veranstaltung' },
        { emoji: '💍', title: 'Hochzeit',    desc: 'Empfang & Probe-Abendessen'     },
        { emoji: '🥂', title: 'Feier',       desc: 'Jeder besondere Anlass'         },
      ],
    },
    howItWorks: {
      eyebrow: 'So funktioniert es',
      heading: 'In 3 Schritten zum Tisch.',
      steps: [
        { title: 'Restaurant finden',       body: 'Suchen Sie nach Name, Küche oder Stadt. Sehen Sie, was heute und morgen verfügbar ist.' },
        { title: 'Datum & Uhrzeit wählen',  body: 'Wählen Sie Datum, Personenanzahl und Wunschzeit. Live-Verfügbarkeit – kein Raten.' },
        { title: 'Bestätigen & fertig',     body: 'Name, E-Mail, Telefon eingeben – Einwilligung bestätigen und Ihre Buchung ist sofort bestätigt.' },
      ],
      cta: 'Alle Restaurants durchsuchen',
    },
    testimonials: {
      eyebrow: 'Was Inhaber sagen',
      heading: 'Von Restaurants in ganz Österreich geschätzt.',
      addCta:  'Restaurant eintragen',
      items: [
        { name: 'Maria K.',  role: 'Inhaberin · Gasthaus Zum Wohl, Wien',  stars: 5, quote: 'Seit dem Wechsel zu Reservely haben wir 80 % weniger Telefonanrufe. Gäste lieben es, online zu buchen – und ich schätze es, während des Service nicht mehr gestört zu werden.' },
        { name: 'Thomas R.', role: 'Manager · Trattoria Rosso, Graz',     stars: 5, quote: 'Die WhatsApp-Benachrichtigungen sind ein echter Gamechanger. Ich sehe jede neue Buchung sofort – selbst an meinem freien Tag.' },
        { name: 'Sophie L.', role: 'Inhaberin · Café Licht, Salzburg',    stars: 5, quote: 'Die Einrichtung war an einem Nachmittag erledigt. Die Tischplanansicht macht es unglaublich einfach, auf einen Blick zu sehen, was gebucht und was noch frei ist.' },
      ],
    },
  },
} as const

// ── For-restaurants page ──────────────────────────────────────────────────────

export const forRestaurantsT = {
  EN: {
    nav: { forGuests: 'For guests', pricing: 'Pricing', getStarted: 'Get started' },
    hero: {
      badge:       'Built for restaurants & cafés in Europe',
      title:       'Stop managing bookings\nby phone.',
      subtitle:    'Reservely gives your restaurant a beautiful online booking page, visual floor plan, and WhatsApp alerts — set up in under 10 minutes.',
      cta:         'Get started free',
      demo:        'See a demo',
      disclaimer:  'No credit card required · Free plan available · Cancel anytime',
    },
    ownerStats: [
      { num: '80%', label: 'fewer phone calls'     },
      { num: '2×',  label: 'more online bookings'  },
      { num: '10',  label: 'minutes to set up'      },
    ],
    features: {
      eyebrow: 'Features',
      heading: 'Everything you need to run bookings smoothly.',
      items: [
        { title: 'Live booking page',         body: 'Guests book directly from your custom URL. Real-time availability, no double-bookings.'          },
        { title: 'Visual floor plan',         body: 'Drag-and-drop table management. See occupancy at a glance with a live SVG floor plan.'          },
        { title: 'WhatsApp notifications',    body: 'Instant WhatsApp alerts when a new booking arrives — no app required.'                          },
        { title: 'Guest profiles',            body: 'Track returning guests, preferences, and visit history automatically.'                           },
        { title: 'QR code check-in',          body: 'Guests scan a QR on arrival. Staff marks tables occupied with one tap.'                        },
        { title: 'Reporting & insights',      body: 'Daily summaries, monthly trends, peak-hours heatmap — all in one dashboard.'                   },
      ],
    },
    howItWorks: {
      eyebrow: 'How it works',
      heading: 'Up and running in an afternoon.',
      steps: [
        { title: 'Set up your profile',      body: 'Add your restaurant name, opening hours, and floor plan. Takes under 10 minutes.'             },
        { title: 'Share your booking link',  body: 'Paste reservely.app/book/your-slug in your bio, Google listing, or website.'                  },
        { title: 'Accept & manage bookings', body: 'Confirm, reschedule, or cancel from the dashboard. WhatsApp alerts keep you in the loop.'     },
      ],
    },
    demo: {
      eyebrow:    'Live demo',
      heading:    'See what your guests experience.',
      subtitle:   'Try a real booking flow — explore the floor plan, pick a time, and see the confirmation screen.',
      cta:        'Try guest demo',
      disclaimer: 'No data is saved in demo mode.',
    },
    testimonials: {
      eyebrow: 'What owners say',
      heading: 'Trusted by restaurants across Austria.',
      items: [
        { name: 'Maria K.', role: 'Owner · Gasthaus Zum Wohl, Vienna', stars: 5, quote: "Since switching to Reservely, we've cut phone calls by 80%. Guests love booking online and I love not being interrupted during service." },
        { name: 'Thomas R.', role: 'Manager · Trattoria Rosso, Graz',  stars: 5, quote: "The WhatsApp alerts are a game-changer. I see every new booking the second it comes in — even on my day off." },
        { name: 'Sophie L.', role: 'Owner · Café Licht, Salzburg',     stars: 5, quote: "Setup was done in an afternoon. The floor plan view makes it so easy to see what's booked and what's free at a glance." },
      ],
    },
    pricing: {
      eyebrow:    'Pricing',
      heading:    'Simple, transparent pricing.',
      subtitle:   'No contracts. No setup fees. Cancel anytime.',
      mostPopular: 'Most popular',
      forever:    'forever',
      perMonth:   'per month',
      tiers: [
        { name: 'Starter',  price: '€0',  description: 'Perfect for getting started.',    cta: 'Get started free',     features: ['Up to 30 bookings/month','Custom booking page','Email confirmations','Basic floor plan (up to 10 tables)','Guest list'] },
        { name: 'Pro',      price: '€29', description: 'For growing restaurants.',         cta: 'Start free trial',     features: ['Unlimited bookings','WhatsApp notifications','Advanced floor plan (unlimited tables)','Guest profiles & history','QR code check-in','Monthly analytics report','Priority support'] },
        { name: 'Business', price: '€79', description: 'Multi-location & high-volume.',    cta: 'Contact us',           features: ['Everything in Pro','Up to 5 locations','Staff accounts (unlimited)','Custom domain','API access','Dedicated onboarding'] },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      heading: 'Common questions.',
      items: [
        { q: 'Is there a setup fee?',                  a: 'No. Reservely is free to start and there are no hidden fees. The Starter plan is free forever; Pro and Business are billed monthly with no contracts.' },
        { q: 'Do guests need to create an account?',   a: 'No. Guests book with just their name, email, and phone — no app download, no sign-up required.' },
        { q: 'Can I import my existing reservations?', a: "Yes. You can import bookings via CSV from your current system. Contact us and we'll help with migration." },
        { q: 'How does GDPR compliance work?',         a: 'Reservely handles guest data in accordance with GDPR. Consent is collected at booking time. Guest data is stored on EU servers (Supabase EU region).' },
        { q: 'Can I customise the booking form?',      a: 'On Pro and Business you can add custom questions (e.g. allergy info, occasion) to the booking flow.' },
        { q: 'What happens if I exceed the Starter limit?', a: "We'll notify you when you're approaching 30 bookings/month. You can upgrade at any time with one click — no bookings are ever lost." },
      ],
    },
    cta: {
      heading:  'Ready to fill more tables?',
      subtitle: 'Join restaurants across Austria already using Reservely. Start free — no credit card needed.',
      button:   'Get started for free',
    },
    footer: {
      platform: 'Platform',
      platformLinks: [
        { href: '/',            label: 'For guests'       },
        { href: '/restaurants', label: 'Find restaurants' },
        { href: '/login',       label: 'Sign in'          },
        { href: '/demo',        label: 'Try demo'         },
      ],
    },
  },

  DE: {
    nav: { forGuests: 'Für Gäste', pricing: 'Preise', getStarted: 'Jetzt starten' },
    hero: {
      badge:       'Für Restaurants & Cafés in Europa',
      title:       'Schluss mit der Buchungsverwaltung\nper Telefon.',
      subtitle:    'Reservely gibt Ihrem Restaurant eine schöne Online-Buchungsseite, einen visuellen Tischplan und WhatsApp-Benachrichtigungen – in unter 10 Minuten eingerichtet.',
      cta:         'Kostenlos starten',
      demo:        'Demo ansehen',
      disclaimer:  'Keine Kreditkarte erforderlich · Kostenloser Plan verfügbar · Jederzeit kündbar',
    },
    ownerStats: [
      { num: '80%', label: 'weniger Telefonanrufe'  },
      { num: '2×',  label: 'mehr Online-Buchungen'  },
      { num: '10',  label: 'Minuten zum Einrichten' },
    ],
    features: {
      eyebrow: 'Funktionen',
      heading: 'Alles, was Sie für reibungslose Buchungen brauchen.',
      items: [
        { title: 'Live-Buchungsseite',            body: 'Gäste buchen direkt über Ihre individuelle URL. Echtzeit-Verfügbarkeit, keine Doppelbuchungen.'                             },
        { title: 'Visueller Tischplan',           body: 'Drag-and-drop Tischverwaltung. Sehen Sie die Auslastung auf einen Blick mit einem Live-SVG-Grundriss.'                     },
        { title: 'WhatsApp-Benachrichtigungen',   body: 'Sofortige WhatsApp-Benachrichtigungen bei neuen Buchungen – keine App erforderlich.'                                        },
        { title: 'Gastprofile',                   body: 'Wiederkehrende Gäste, Präferenzen und Besuchshistorie werden automatisch erfasst.'                                          },
        { title: 'QR-Code Check-in',              body: 'Gäste scannen einen QR-Code beim Eintreffen. Mitarbeiter markieren Tische mit einem Tippen als besetzt.'                   },
        { title: 'Berichte & Einblicke',          body: 'Tägliche Zusammenfassungen, monatliche Trends, Stoßzeiten-Heatmap – alles in einem Dashboard.'                            },
      ],
    },
    howItWorks: {
      eyebrow: 'So funktioniert es',
      heading: 'In einem Nachmittag einsatzbereit.',
      steps: [
        { title: 'Profil einrichten',              body: 'Restaurantname, Öffnungszeiten und Tischplan hinzufügen. Dauert unter 10 Minuten.'                                       },
        { title: 'Buchungslink teilen',            body: 'Fügen Sie reservely.app/book/ihr-slug in Ihre Bio, Ihren Google-Eintrag oder Ihre Website ein.'                          },
        { title: 'Buchungen annehmen & verwalten', body: 'Bestätigen, verschieben oder stornieren Sie über das Dashboard. WhatsApp-Benachrichtigungen halten Sie auf dem Laufenden.' },
      ],
    },
    demo: {
      eyebrow:    'Live-Demo',
      heading:    'Erleben Sie, was Ihre Gäste sehen.',
      subtitle:   'Probieren Sie einen echten Buchungsablauf aus – erkunden Sie den Tischplan, wählen Sie eine Uhrzeit und sehen Sie den Bestätigungsbildschirm.',
      cta:        'Gast-Demo ausprobieren',
      disclaimer: 'Im Demo-Modus werden keine Daten gespeichert.',
    },
    testimonials: {
      eyebrow: 'Was Inhaber sagen',
      heading: 'Von Restaurants in ganz Österreich geschätzt.',
      items: [
        { name: 'Maria K.',  role: 'Inhaberin · Gasthaus Zum Wohl, Wien', stars: 5, quote: 'Seit dem Wechsel zu Reservely haben wir 80 % weniger Telefonanrufe. Gäste lieben es, online zu buchen – und ich schätze es, während des Service nicht mehr gestört zu werden.' },
        { name: 'Thomas R.', role: 'Manager · Trattoria Rosso, Graz',    stars: 5, quote: 'Die WhatsApp-Benachrichtigungen sind ein echter Gamechanger. Ich sehe jede neue Buchung sofort – selbst an meinem freien Tag.' },
        { name: 'Sophie L.', role: 'Inhaberin · Café Licht, Salzburg',   stars: 5, quote: 'Die Einrichtung war an einem Nachmittag erledigt. Die Tischplanansicht macht es unglaublich einfach, auf einen Blick zu sehen, was gebucht und was noch frei ist.' },
      ],
    },
    pricing: {
      eyebrow:    'Preise',
      heading:    'Einfache, transparente Preise.',
      subtitle:   'Keine Verträge. Keine Einrichtungsgebühren. Jederzeit kündbar.',
      mostPopular: 'Am beliebtesten',
      forever:    'für immer',
      perMonth:   'pro Monat',
      tiers: [
        { name: 'Starter',  price: '€0',  description: 'Perfekt für den Einstieg.',        cta: 'Kostenlos starten',        features: ['Bis zu 30 Buchungen/Monat','Individuelle Buchungsseite','E-Mail-Bestätigungen','Basis-Tischplan (bis zu 10 Tische)','Gästeliste'] },
        { name: 'Pro',      price: '€29', description: 'Für wachsende Restaurants.',       cta: 'Kostenlose Testversion',    features: ['Unbegrenzte Buchungen','WhatsApp-Benachrichtigungen','Erweiterter Tischplan (unbegrenzte Tische)','Gastprofile & -verlauf','QR-Code Check-in','Monatlicher Analysebericht','Prioritäts-Support'] },
        { name: 'Business', price: '€79', description: 'Mehrere Standorte & hohes Volumen.', cta: 'Kontakt aufnehmen',      features: ['Alles aus Pro','Bis zu 5 Standorte','Mitarbeiterkonten (unbegrenzt)','Eigene Domain','API-Zugang','Persönliches Onboarding'] },
      ],
    },
    faq: {
      eyebrow: 'FAQ',
      heading: 'Häufige Fragen.',
      items: [
        { q: 'Gibt es eine Einrichtungsgebühr?',                   a: 'Nein. Reservely ist kostenlos zu starten, es gibt keine versteckten Gebühren. Der Starter-Plan ist dauerhaft kostenlos; Pro und Business werden monatlich ohne Vertrag abgerechnet.' },
        { q: 'Müssen Gäste ein Konto erstellen?',                  a: 'Nein. Gäste buchen nur mit Name, E-Mail und Telefon – kein App-Download, keine Registrierung erforderlich.' },
        { q: 'Kann ich bestehende Reservierungen importieren?',    a: 'Ja. Sie können Buchungen per CSV aus Ihrem aktuellen System importieren. Kontaktieren Sie uns, und wir helfen bei der Migration.' },
        { q: 'Wie funktioniert die DSGVO-Konformität?',            a: 'Reservely verarbeitet Gastdaten gemäß DSGVO. Die Einwilligung wird zum Buchungszeitpunkt eingeholt. Gastdaten werden auf EU-Servern gespeichert (Supabase EU-Region).' },
        { q: 'Kann ich das Buchungsformular anpassen?',            a: 'Mit Pro und Business können Sie dem Buchungsablauf benutzerdefinierte Fragen hinzufügen (z. B. Allergieinformationen, Anlass).' },
        { q: 'Was passiert, wenn ich das Starter-Limit überschreite?', a: 'Wir benachrichtigen Sie, wenn Sie sich 30 Buchungen/Monat nähern. Sie können jederzeit mit einem Klick upgraden – keine Buchungen gehen verloren.' },
      ],
    },
    cta: {
      heading:  'Bereit, mehr Tische zu füllen?',
      subtitle: 'Schließen Sie sich Restaurants in ganz Österreich an, die bereits Reservely nutzen. Kostenlos starten – keine Kreditkarte erforderlich.',
      button:   'Kostenlos starten',
    },
    footer: {
      platform: 'Plattform',
      platformLinks: [
        { href: '/',            label: 'Für Gäste'            },
        { href: '/restaurants', label: 'Restaurants finden'   },
        { href: '/login',       label: 'Anmelden'             },
        { href: '/demo',        label: 'Demo ausprobieren'    },
      ],
    },
  },
} as const

// ── Restaurants listing page ───────────────────────────────────────────────────

export const restaurantsT = {
  EN: {
    nav:         { forRestaurants: 'For restaurants →' },
    hero:        { title: 'Find & Book a Table', subtitle: 'Discover restaurants and book instantly — no phone calls, no waiting.' },
    search:      { placeholder: 'Search by restaurant, cuisine, or city…' },
    filter:      { allCities: 'All cities' },
    count:       (n: number) => `${n} restaurant${n !== 1 ? 's' : ''} available`,
    noDesc:      'No description yet.',
    book:        'Book a table',
    noResults:   'No restaurants found',
    noResultsQ:  (q: string) => `No results for "${q}"`,
    noListed:    'No restaurants are listed yet.',
    clearSearch: 'Clear search',
    error:       'Failed to load restaurants',
  },
  DE: {
    nav:         { forRestaurants: 'Für Restaurants →' },
    hero:        { title: 'Tisch finden & reservieren', subtitle: 'Entdecken Sie Restaurants und buchen Sie sofort – ohne Telefonanrufe, ohne Warten.' },
    search:      { placeholder: 'Restaurant, Küche oder Stadt suchen…' },
    filter:      { allCities: 'Alle Städte' },
    count:       (n: number) => `${n} Restaurant${n !== 1 ? 's' : ''} verfügbar`,
    noDesc:      'Noch keine Beschreibung.',
    book:        'Tisch reservieren',
    noResults:   'Keine Restaurants gefunden',
    noResultsQ:  (q: string) => `Keine Ergebnisse für „${q}"`,
    noListed:    'Noch keine Restaurants eingetragen.',
    clearSearch: 'Suche zurücksetzen',
    error:       'Restaurants konnten nicht geladen werden',
  },
} as const

// ── Group booking page ────────────────────────────────────────────────────────

export const groupBookingT = {
  EN: {
    nav:    { back: 'Reservely' },
    badge:  'Group Events',
    steps: ['restaurant', 'event', 'contact'] as const,
    stepHeaders: {
      restaurant: { title: 'Choose a restaurant',   subtitle: "Select where you'd like to host your group event"    },
      event:      { title: 'Event details',          subtitle: 'Tell us about your group and occasion'               },
      contact:    { title: 'Your contact details',   subtitle: "We'll send your inquiry directly to the restaurant"  },
    },
    search:      'Search restaurant, city, or cuisine…',
    noResults:   'No restaurants found',
    change:      'Change',
    eventType:   'Event type',
    eventTypes: [
      { emoji: '🎂', label: 'Birthday'         },
      { emoji: '💼', label: 'Corporate'        },
      { emoji: '💍', label: 'Wedding'          },
      { emoji: '🥂', label: 'Celebration'      },
      { emoji: '🎓', label: 'Graduation'       },
      { emoji: '🏆', label: 'Team event'       },
      { emoji: '🍽️', label: 'Family gathering' },
      { emoji: '🎉', label: 'Other'            },
    ],
    groupNamePlaceholder: "Group / event name (e.g. Smith's 50th Birthday)",
    guestCount:  'Guest count',
    menuPref:    'Menu preference',
    menuLabels:  { set_menu: 'Set menu', a_la_carte: 'À la carte', buffet: 'Buffet' },
    requestsPlaceholder: 'Special requests, dietary needs, AV equipment, decorations…',
    endTimeOptional: 'optional',
    continue:    'Continue →',
    summary:     'Your inquiry summary',
    editEvent:   'Edit event details',
    fields: {
      name:  'Your full name',
      email: 'Email address',
      phone: 'Phone number (optional)',
    },
    consentTemplate: (restaurant: string) =>
      `I consent to my contact details being shared with ${restaurant} for the purpose of this group event inquiry (GDPR Art. 6).`,
    privacyLink: 'Privacy policy',
    sendButton:  'Send group inquiry →',
    error:       'Network error. Please try again.',
    done: {
      title:     'Inquiry sent!',
      message:   (restaurant: string, email: string) =>
        `Your group event inquiry has been sent to ${restaurant}. They will contact you at ${email} to confirm the details.`,
      nextHeading: 'What happens next',
      nextSteps: [
        'The restaurant will review your inquiry',
        "They'll contact you within 24–48 hours to confirm availability",
        "You'll work out the final details directly",
      ],
      backHome:   'Back to home',
      browseR:    'Browse restaurants',
    },
  },

  DE: {
    nav:    { back: 'Reservely' },
    badge:  'Gruppenevents',
    steps: ['restaurant', 'event', 'contact'] as const,
    stepHeaders: {
      restaurant: { title: 'Restaurant auswählen',    subtitle: 'Wählen Sie, wo Sie Ihr Gruppen-Event veranstalten möchten'           },
      event:      { title: 'Veranstaltungsdetails',   subtitle: 'Erzählen Sie uns von Ihrer Gruppe und dem Anlass'                    },
      contact:    { title: 'Ihre Kontaktdaten',       subtitle: 'Wir senden Ihre Anfrage direkt an das Restaurant'                    },
    },
    search:      'Restaurant, Stadt oder Küche suchen…',
    noResults:   'Keine Restaurants gefunden',
    change:      'Ändern',
    eventType:   'Veranstaltungsart',
    eventTypes: [
      { emoji: '🎂', label: 'Geburtstag'        },
      { emoji: '💼', label: 'Firmenevent'       },
      { emoji: '💍', label: 'Hochzeit'          },
      { emoji: '🥂', label: 'Feier'             },
      { emoji: '🎓', label: 'Abschlussfeier'    },
      { emoji: '🏆', label: 'Teamevent'         },
      { emoji: '🍽️', label: 'Familienfeier'     },
      { emoji: '🎉', label: 'Sonstiges'         },
    ],
    groupNamePlaceholder: 'Gruppen-/Veranstaltungsname (z. B. Meiers 50. Geburtstag)',
    guestCount:  'Gästezahl',
    menuPref:    'Menüpräferenz',
    menuLabels:  { set_menu: 'Menü', a_la_carte: 'À la carte', buffet: 'Buffet' },
    requestsPlaceholder: 'Sonderwünsche, Ernährungsbedürfnisse, AV-Ausstattung, Dekoration…',
    endTimeOptional: 'optional',
    continue:    'Weiter →',
    summary:     'Ihre Anfragezusammenfassung',
    editEvent:   'Veranstaltungsdetails bearbeiten',
    fields: {
      name:  'Vollständiger Name',
      email: 'E-Mail-Adresse',
      phone: 'Telefonnummer (optional)',
    },
    consentTemplate: (restaurant: string) =>
      `Ich stimme zu, dass meine Kontaktdaten zum Zweck dieser Gruppenanfrage an ${restaurant} weitergegeben werden (DSGVO Art. 6).`,
    privacyLink: 'Datenschutzerklärung',
    sendButton:  'Gruppenanfrage senden →',
    error:       'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    done: {
      title:     'Anfrage gesendet!',
      message:   (restaurant: string, email: string) =>
        `Ihre Gruppenanfrage wurde an ${restaurant} gesendet. Sie werden sich unter ${email} mit Ihnen in Verbindung setzen, um die Details zu bestätigen.`,
      nextHeading: 'Was als Nächstes passiert',
      nextSteps: [
        'Das Restaurant prüft Ihre Anfrage',
        'Sie kontaktieren Sie innerhalb von 24–48 Stunden zur Bestätigung der Verfügbarkeit',
        'Die endgültigen Details werden direkt mit Ihnen geklärt',
      ],
      backHome:   'Zur Startseite',
      browseR:    'Restaurants erkunden',
    },
  },
} as const

// ── Legal pages ───────────────────────────────────────────────────────────────

export const legalT = {
  EN: {
    hub: {
      title:           'Legal & Compliance',
      subtitle:        'All legal documents for Reservely in one place — covering GDPR compliance, cookie usage, terms of service, and mandatory legal disclosures for the EU/Germany/Austria region.',
      backHome:        'Back to home',
      breadcrumbLegal: 'Legal',
      readDocument:    'Read document',
      gdprTitle:       'GDPR compliance',
      gdprBody:        "Reservely stores all personal data on EU-based infrastructure (Supabase Frankfurt region). We act as a data processor for restaurant operators who are the data controllers for their guests' information.",
      contactTitle:    'Contact for legal matters',
      contactBody:     'For data protection requests, legal enquiries, or GDPR rights, contact us directly:',
      copyright:       (year: number) => `© ${year} Reservely · All documents were last reviewed June 2026`,
      docs: [
        { href: '/impressum', label: 'Impressum',       badge: 'DE · AT required', badgeColor: 'bg-blue-50 text-blue-700',   desc: 'Legal disclosure notice required under German and Austrian law (§5 TMG / §5 ECG). Contains company name, address, contact details, and commercial register information.' },
        { href: '/privacy',   label: 'Privacy Policy',  badge: 'GDPR',             badgeColor: 'bg-green-50 text-green-700', desc: 'Explains what personal data we collect, why we collect it, who we share it with, and what rights you have under the GDPR (Art. 13/14 GDPR).' },
        { href: '/cookies',   label: 'Cookie Policy',   badge: 'ePrivacy',         badgeColor: 'bg-amber-50 text-amber-700', desc: 'Details about the technically-necessary cookies used by Reservely for authentication. No tracking or advertising cookies are used.' },
        { href: '/terms',     label: 'Terms of Service', badge: 'All users',       badgeColor: 'bg-purple-50 text-purple-700', desc: 'The legal agreement between Reservely and restaurant operators covering acceptable use, data responsibilities, liability limits, and governing law.' },
      ],
    },
    layout: {
      allDocs:         'All legal documents',
      backToReservely: 'Back to Reservely',
      breadcrumbHome:  'Home',
      breadcrumbLegal: 'Legal',
      documents:       'Documents',
      questions:       'Questions?',
      questionsBody:   'Contact our legal team for any queries about these documents.',
      updated:         'Updated',
      otherDocs:       'Other legal documents',
      allDocsFooter:   'All legal docs →',
      sidebar: [
        { href: '/impressum', label: 'Impressum',        desc: 'Legal notice (§5 TMG)'      },
        { href: '/privacy',   label: 'Privacy Policy',   desc: 'GDPR & data processing'     },
        { href: '/cookies',   label: 'Cookie Policy',    desc: 'How we use cookies'         },
        { href: '/terms',     label: 'Terms of Service', desc: 'Usage terms & conditions'   },
      ],
    },
    privacy:  { title: 'Privacy Policy',   subtitle: 'How Reservely collects, uses, and protects your personal data',  updatedAt: 'June 2026' },
    terms:    { title: 'Terms of Service', subtitle: 'The agreement between Reservely and restaurant operators',         updatedAt: 'June 2026' },
    cookies:  { title: 'Cookie Policy',    subtitle: 'What cookies Reservely uses and why',                             updatedAt: 'June 2026' },
  },
  DE: {
    hub: {
      title:           'Rechtliches & Compliance',
      subtitle:        'Alle Rechtsdokumente von Reservely an einem Ort – DSGVO-Konformität, Cookie-Nutzung, Nutzungsbedingungen und gesetzlich vorgeschriebene Angaben für die EU/Deutschland/Österreich.',
      backHome:        'Zurück zur Startseite',
      breadcrumbLegal: 'Rechtliches',
      readDocument:    'Dokument lesen',
      gdprTitle:       'DSGVO-Konformität',
      gdprBody:        'Reservely speichert alle personenbezogenen Daten auf EU-basierter Infrastruktur (Supabase Frankfurt). Wir agieren als Auftragsverarbeiter für Restaurantbetreiber, die als Verantwortliche für die Daten ihrer Gäste fungieren.',
      contactTitle:    'Rechtlicher Kontakt',
      contactBody:     'Für Datenschutzanfragen, rechtliche Anfragen oder DSGVO-Rechte wenden Sie sich direkt an uns:',
      copyright:       (year: number) => `© ${year} Reservely · Alle Dokumente wurden zuletzt im Juni 2026 geprüft`,
      docs: [
        { href: '/impressum', label: 'Impressum',            badge: 'DE · AT Pflicht',  badgeColor: 'bg-blue-50 text-blue-700',   desc: 'Gesetzlich vorgeschriebene Anbieterkennzeichnung nach deutschem und österreichischem Recht (§5 TMG / §5 ECG). Enthält Firmenname, Adresse, Kontaktdaten und Handelsregisterinformationen.' },
        { href: '/privacy',   label: 'Datenschutzerklärung', badge: 'DSGVO',            badgeColor: 'bg-green-50 text-green-700', desc: 'Erläutert, welche personenbezogenen Daten wir erheben, warum wir sie erheben, mit wem wir sie teilen und welche Rechte Sie gemäß DSGVO haben (Art. 13/14 DSGVO).' },
        { href: '/cookies',   label: 'Cookie-Richtlinie',   badge: 'ePrivacy',          badgeColor: 'bg-amber-50 text-amber-700', desc: 'Details zu den technisch notwendigen Cookies, die Reservely zur Authentifizierung verwendet. Es werden keine Tracking- oder Werbe-Cookies eingesetzt.' },
        { href: '/terms',     label: 'Nutzungsbedingungen',  badge: 'Alle Nutzer',      badgeColor: 'bg-purple-50 text-purple-700', desc: 'Die rechtliche Vereinbarung zwischen Reservely und Restaurantbetreibern zu zulässiger Nutzung, Datenzuständigkeit, Haftungsbeschränkungen und anwendbarem Recht.' },
      ],
    },
    layout: {
      allDocs:         'Alle Rechtsdokumente',
      backToReservely: 'Zurück zu Reservely',
      breadcrumbHome:  'Startseite',
      breadcrumbLegal: 'Rechtliches',
      documents:       'Dokumente',
      questions:       'Fragen?',
      questionsBody:   'Wenden Sie sich bei Fragen zu diesen Dokumenten an unser Rechtsteam.',
      updated:         'Aktualisiert',
      otherDocs:       'Weitere Rechtsdokumente',
      allDocsFooter:   'Alle Rechtsdokumente →',
      sidebar: [
        { href: '/impressum', label: 'Impressum',            desc: 'Rechtlicher Hinweis (§5 TMG)'  },
        { href: '/privacy',   label: 'Datenschutzerklärung', desc: 'DSGVO & Datenverarbeitung'    },
        { href: '/cookies',   label: 'Cookie-Richtlinie',    desc: 'Cookie-Verwendung'             },
        { href: '/terms',     label: 'Nutzungsbedingungen',  desc: 'Nutzungsbedingungen'           },
      ],
    },
    privacy:  { title: 'Datenschutzerklärung', subtitle: 'Wie Reservely Ihre personenbezogenen Daten erhebt, verwendet und schützt', updatedAt: 'Juni 2026' },
    terms:    { title: 'Nutzungsbedingungen',  subtitle: 'Die Vereinbarung zwischen Reservely und Restaurantbetreibern',              updatedAt: 'Juni 2026' },
    cookies:  { title: 'Cookie-Richtlinie',    subtitle: 'Welche Cookies Reservely verwendet und warum',                             updatedAt: 'Juni 2026' },
  },
} as const
