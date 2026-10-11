/* One config per trade. landing.html and registered.html read this by URL. */
(function () {
  var trades = {
    hvac: {
      id: 'hvac',
      tag: 'HVAC',
      path: '/hvac-workshop',
      smsName: 'HVAC',
      video: '/trade-workshop/video/hvac-v2.mp4',
      poster: '/trade-workshop/video/hvac-v2-poster.jpg',
      eyebrow: 'Free workshop for HVAC owners',
      pageTitle: 'Free workshop for Hamptons HVAC owners \u2014 Seth Quest',
      description: 'Free 30-minute workshop for Hamptons HVAC company owners: stop losing jobs to missed calls and slow quotes.',
      ogTitle: 'Free workshop for Hamptons HVAC company owners',
      ogDescription: 'How Hamptons HVAC companies stop losing jobs to missed calls and slow quotes. Free, 30 minutes, live on Zoom.',
      calendarTitle: 'Free workshop for Hamptons HVAC company owners',
      details: 'Free 30-minute workshop with Seth Quest for Hamptons HVAC company owners: missed calls, slow quotes, follow-up, your Google Business Profile, and where new leads come from.',
      sectionTitle: 'Where the jobs leak out',
      host: 'I live in East Hampton and fix the leaks in local service businesses: missed calls, slow quotes and no follow-up. Then I help fill the funnel with more leads.',
      audit: 'We look at your business together, find the biggest leaks, and you leave with a plan, whether you hire me or not.',
      bullets: [
        ['The missed-call fix that works while you\u2019re in an attic.', 'Every caller gets a text back in seconds, before they call the next company.'],
        ['Why slow quotes and no follow-up cost you jobs you already earned,', 'and how to send quotes the same day and follow up without lifting a finger.'],
        ['The Google Business Profile mistakes that send your calls to the other guy,', 'like the wrong phone number one Montauk business had listed.'],
        ['Where new leads come from once the leaks are fixed,', 'so every dollar you spend on ads actually turns into jobs.']
      ]
    },
    electrician: {
      id: 'electrician',
      tag: 'Electrician',
      path: '/electrician-workshop',
      smsName: 'electrical contractor',
      video: '/trade-workshop/video/electrician-v2.mp4',
      poster: '/trade-workshop/video/electrician-v2-poster.jpg',
      eyebrow: 'Free workshop for electrical contractors',
      pageTitle: 'Free workshop for Hamptons electrical contractors \u2014 Seth Quest',
      description: 'Free 30-minute workshop for Hamptons electrical contractors: stop losing jobs to missed calls and slow quotes.',
      ogTitle: 'Free workshop for Hamptons electrical contractors',
      ogDescription: 'How Hamptons electrical contractors stop losing jobs to missed calls and slow quotes. Free, 30 minutes, live on Zoom.',
      calendarTitle: 'Free workshop for Hamptons electrical contractors',
      details: 'Free 30-minute workshop with Seth Quest for Hamptons electrical contractors: missed calls, slow quotes, follow-up, your Google Business Profile, and where new leads come from.',
      sectionTitle: 'Where the jobs leak out',
      host: 'I live in East Hampton and fix the leaks in local service businesses: missed calls, slow quotes and no follow-up. Then I help fill the funnel with more leads.',
      audit: 'We look at your business together, find the biggest leaks, and you leave with a plan, whether you hire me or not.',
      bullets: [
        ['The missed-call fix that works while you\u2019re on a job.', 'Every caller gets a text back in seconds, before they call the next company.'],
        ['Why slow quotes and no follow-up cost you jobs you already earned,', 'and how to send quotes the same day and follow up without lifting a finger.'],
        ['The Google Business Profile mistakes that send your calls to the other guy,', 'like the wrong phone number one Montauk business had listed.'],
        ['Where new leads come from once the leaks are fixed,', 'so every dollar you spend on ads actually turns into jobs.']
      ]
    },
    general: {
      id: 'general',
      tag: 'General',
      path: '/workshop',
      smsName: 'free',
      video: '/trade-workshop/video/general-v1.mp4',
      poster: '/trade-workshop/video/general-v1-poster.jpg',
      eyebrow: 'Free workshop for service businesses',
      pageTitle: 'Free workshop for Hamptons service business owners \u2014 Seth Quest',
      description: 'Free 30-minute workshop for Hamptons service business owners: stop losing jobs to missed calls and slow quotes.',
      ogTitle: 'Free workshop for Hamptons service business owners',
      ogDescription: 'How Hamptons service businesses stop losing jobs to missed calls and slow quotes. Free, 30 minutes, live on Zoom.',
      calendarTitle: 'Free workshop for Hamptons service business owners',
      details: 'Free 30-minute workshop with Seth Quest for Hamptons service business owners: missed calls, slow quotes, follow-up, your Google Business Profile, and where new leads come from.',
      sectionTitle: 'Where the jobs leak out',
      host: 'I live in East Hampton and fix the leaks in local service businesses: missed calls, slow quotes and no follow-up. Then I help fill the funnel with more leads.',
      audit: 'We look at your business together, find the biggest leaks, and you leave with a plan, whether you hire me or not.',
      bullets: [
        ['The missed-call fix that works while you\u2019re out on a job.', 'Contractors, cleaners, landscapers, and every other local service business: every caller gets a text back in seconds, before they call the next company.'],
        ['Why slow quotes and no follow-up cost you jobs you already earned,', 'and how to send quotes the same day and follow up without lifting a finger.'],
        ['The Google Business Profile mistakes that send your calls to the other guy,', 'like the wrong phone number one Montauk business had listed.'],
        ['Where new leads come from once missed calls and slow quotes are fixed,', 'so every dollar you spend on ads actually turns into jobs.']
      ]
    },
    plumbing: {
      id: 'plumbing',
      tag: 'Plumbing',
      path: '/plumbing-workshop',
      smsName: 'plumbing',
      video: '/trade-workshop/video/plumbing-v2.mp4',
      poster: '/trade-workshop/video/plumbing-v2-poster.jpg',
      eyebrow: 'Free workshop for plumbing company owners',
      pageTitle: 'Free workshop for Hamptons plumbing company owners \u2014 Seth Quest',
      description: 'Free 30-minute workshop for Hamptons plumbing company owners: stop losing jobs to missed calls and slow quotes.',
      ogTitle: 'Free workshop for Hamptons plumbing company owners',
      ogDescription: 'How Hamptons plumbing companies stop losing jobs to missed calls and slow quotes. Free, 30 minutes, live on Zoom.',
      calendarTitle: 'Free workshop for Hamptons plumbing company owners',
      details: 'Free 30-minute workshop with Seth Quest for Hamptons plumbing company owners: missed calls, slow quotes, follow-up, your Google Business Profile, and where new leads come from.',
      sectionTitle: 'Where the jobs slip away',
      host: 'I live in East Hampton and fix missed calls, slow quotes and no follow-up for local service businesses. Then I help fill the funnel with more leads.',
      audit: 'We look at your business together, find what\u2019s costing you jobs, and you leave with a plan, whether you hire me or not.',
      bullets: [
        ['The missed-call fix that works while you\u2019re under a sink.', 'Every caller gets a text back in seconds, before they call the next company.'],
        ['Why slow quotes and no follow-up cost you jobs you already earned,', 'and how to send quotes the same day and follow up without lifting a finger.'],
        ['The Google Business Profile mistakes that send your calls to the other guy,', 'like the wrong phone number one Montauk business had listed.'],
        ['Where new leads come from once missed calls and slow quotes are fixed,', 'so every dollar you spend on ads actually turns into jobs.']
      ]
    }
  };
  window.WORKSHOP_TRADES = trades;
  window.WORKSHOP_PAGE = function () {
    var path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (path === '/workshop' || path === '/workshop/registered') {
      return { trade: trades.general, registered: path === '/workshop/registered', id: 'general' };
    }
    var m = path.match(/^\/(hvac|electrician|plumbing)-workshop(\/registered)?$/);
    var id = m ? m[1] : 'hvac';
    return { trade: trades[id], registered: !!(m && m[2]), id: id };
  };
})();
