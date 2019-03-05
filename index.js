const puppeteer = require('puppeteer');

startPuppeteer = async () => {
  return await puppeteer.launch({ headless: true });
};

logProgress = async (index, total) => {
    process.stdout.write(`${index} / ${total} \r`);
}

getDates = async (browser, events, cb) => {
  const page = await browser.newPage();
  const total = Object.entries(events).length;
  let index = 1;
  for (const event of events) {
    cb(index,total);
    const url = event.url;
    try {
      await page.goto(url);
      const _dates = await page.evaluate(() => {
        const dates = document.querySelector('div.c-schedule').innerText;

        return dates;
      });

      const _scripts = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        var script = [];
        for (const s of scripts) {
          script.push(s.innerHTML);
          //console.log(s.innerHTML)
        }
        return script;
      });
      //console.log(JSON.parse(_scripts[0]));
      event.date = '';
      event.scripts = JSON.parse(_scripts);
      index++;
    } catch (error) {
      console.log(error);
    }
  }
  return null;
};

getEvents = async browser => {
  const page = await browser.newPage();

  await page.goto('http://www.motogp.com/fr/calendar');

  let events = await page.evaluate(async () => {
    const grabFromEvent = (event, classname) => {
      const grab = event.querySelector(classname);
      let title = 'N/A';
      if (grab) {
        title = grab.innerText;
      }
      return title;
    };

    const grabLinkFromEvent = (event1, classname) => {
      console.log(event1);
      const grab = event1.querySelector(classname);
      let title = 'N/A';
      if (grab) {
        title = grab.href;
      }
      return title;
    };
    const EVENT_SELECTOR = 'div.event_container';

    const data = [];
    const dataEvents = document.querySelectorAll(EVENT_SELECTOR);
    for (const event of dataEvents) {
      if (event) {
        const link = grabLinkFromEvent(event, 'a.event_image_container') + '#schedule';
        //const dates = getDates(browser, link);

        data.push({
          event,
          name: grabFromEvent(event, 'a.event_name'),
          day: grabFromEvent(event, 'div.event_day'),
          month: grabFromEvent(event, 'div.event_month'),
          url: link,
        });
      }
    }
    return data;
  });

  return events;
};

main = async () => {
  const browser = await startPuppeteer();

  console.log('get events')
  const events = await getEvents(browser);

  
  console.log('get dates')
  await getDates(browser, events, logProgress);

  await browser.close();

  console.log('events', events);

  return null;
};

void (async () => {
  try {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();

    await page.goto('http://www.motogp.com/fr/calendar');

    getDates = async eventUrl => {
      const page = await browser.newPage();
      await page.goto(eventUrl);

      const _dates = await page.emulate(() => {
        const dates = document.querySelector('div.c-schedule').innerText;
        return dates;
      });

      return _dates;
    };

    const events = await page.evaluate(() => {
      const grabFromEvent = (event, classname) => {
        const grab = event.querySelector(classname);
        let title = 'N/A';
        if (grab) {
          title = grab.innerText;
        }
        return title;
      };

      const grabLinkFromEvent = (event1, classname) => {
        console.log(event1);
        const grab = event1.querySelector(classname);
        let title = 'N/A';
        if (grab) {
          title = grab.href;
        }
        return title;
      };

      const EVENT_SELECTOR = 'div.event';

      const data = [];

      const dataEvents = document.querySelectorAll(EVENT_SELECTOR);

      for (const event of dataEvents) {
        const link = grabLinkFromEvent(event, 'a.event_image_container') + '#schedule';
        const dates = getDates(link);

        data.push({
          name: grabFromEvent(event, 'a.event_name'),
          day: grabFromEvent(event, 'div.event_day'),
          month: grabFromEvent(event, 'div.event_month'),
          url: link,
          dates: dates,
        });
      }

      return data;
    });

    console.log(events);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
});

main();
