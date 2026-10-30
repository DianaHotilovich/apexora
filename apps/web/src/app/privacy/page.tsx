'use client';

import { Top, useApp } from '@/components/App';

const TEXT = {
  pl: {
    title: 'Prywatność i dane osobowe',
    intro: 'GridTrip to projekt studencki. Zbieram tylko dane, które są potrzebne do badania i listy oczekujących.',
    blocks: [
      ['Kto jest administratorem', 'Diana Hotilovich, studentka inżynierii oprogramowania na Uniwersytecie VIZJA w Warszawie. Kontakt: przez profil projektu github.com/DianaHotilovich albo odpowiedź na wiadomość, z której masz link.'],
      ['Jakie dane', 'Ankieta: Twoje odpowiedzi i – tylko jeśli go podasz – adres e-mail. Lista oczekujących: adres e-mail i język. Nie zbieram imienia, nazwiska, numeru telefonu ani lokalizacji.'],
      ['Po co', 'Odpowiedzi z ankiety analizuję w projekcie studenckim i pokazuję tylko w formie zbiorczej. E-mail z ankiety służy wyłącznie do umówienia krótkiej rozmowy. E-mail z listy oczekujących – do jednej wiadomości o starcie wersji beta.'],
      ['Podstawa prawna', 'Twoja zgoda (art. 6 ust. 1 lit. a RODO), wyrażona przez wypełnienie ankiety lub zapis na listę. Możesz ją wycofać w każdej chwili.'],
      ['Jak długo', 'Do zakończenia projektu, najpóźniej do 30 czerwca 2027 r. Potem dane usuwam.'],
      ['Kto ma dostęp', 'Tylko ja. Ankiety działają w Microsoft Forms, więc Microsoft przechowuje odpowiedzi jako dostawca usługi. W wersji demo tej strony zapis na listę zostaje tylko w Twojej przeglądarce.'],
      ['Twoje prawa', 'Możesz poprosić o wgląd w swoje dane, ich poprawienie lub usunięcie, a także wycofać zgodę. Masz też prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).'],
    ],
  },
  en: {
    title: 'Privacy and personal data',
    intro: 'GridTrip is a student project. I collect only the data needed for the research and the waitlist.',
    blocks: [
      ['Who is responsible', 'Diana Hotilovich, a software engineering student at VIZJA University in Warsaw. Contact: through the project profile github.com/DianaHotilovich or by replying to the message that gave you the link.'],
      ['What data', 'Survey: your answers and – only if you give it – your e-mail. Waitlist: your e-mail and language. I do not collect names, phone numbers or location.'],
      ['Why', 'Survey answers are analysed in a student project and shown only as totals. A survey e-mail is used only to arrange a short interview. A waitlist e-mail is used for one message about the beta launch.'],
      ['Legal basis', 'Your consent (Art. 6(1)(a) GDPR), given by filling in the survey or joining the list. You can withdraw it at any time.'],
      ['How long', 'Until the project ends, at the latest 30 June 2027. Then the data is deleted.'],
      ['Who has access', 'Only me. The surveys run on Microsoft Forms, so Microsoft stores the answers as the service provider. In the demo version of this site, joining the list is saved only in your browser.'],
      ['Your rights', 'You can ask to see, correct or delete your data and withdraw consent. You can also complain to your data protection authority; in Poland that is the President of the Personal Data Protection Office (uodo.gov.pl).'],
    ],
  },
};

export default function Privacy() {
  const { lang } = useApp();
  const c = TEXT[lang];
  return (
    <main className="wrap">
      <Top back="/" />
      <h1>{c.title}</h1>
      <p className="muted">{c.intro}</p>
      {c.blocks.map(([h, p]) => (
        <section key={h} className="card">
          <h2 className="section-title" style={{ margin: 0 }}>{h}</h2>
          <p className="small">{p}</p>
        </section>
      ))}
    </main>
  );
}
