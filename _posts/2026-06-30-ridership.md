---
layout: post
title: "Mapping King County Metro Ridership"
date: 2026-06-30
categories: transit king-county-metro ridership
---

Living in Seattle, I've come to appreciate the humble bus. I find riding the bus much more pleasant than driving through the city (and certainly much better than circling for parking!), and sitting alongside my fellow Seattleites makes me feel like a participant in the ebb and flow of the city rather than sealed off from it.

Over time, I've gotten a sense for the rhythms of the routes that pass by my home: where people get on, where people get off, and when the bus fills up or empties out. Seeing that, I wondered if I could get that same view more broadly, across the entire city or even the entire region, rather than just the tiny slice visible from my front door.

King County Metro publishes a [rider dashboard](https://kingcounty.gov/en/dept/metro/about/data-and-reports) as well as an annual [system evaluation](https://kingcounty.gov/en/dept/metro/about/data-and-reports/performance-reports) covering route-level performance. Those resources are great for tracking specific routes or for comparing ridership over time, but they don't tell me where ridership is actually concentrated: where people are already riding transit, and where additional service might be most useful. In a city growing as fast as Seattle, getting transit right is a practical necessity; city streets simply cannot absorb the trips that Seattleites need to make.

### Visualizing Ridership

To try to visualize the distribution of ridership across the region, I started by plotting a scatterplot of ridership on a per-stop basis. As expected, ridership is highest in downtown Seattle, especially on 3rd Ave, and in the U District. But it isn't entirely fair to compare those stops to stops in the rest of the region; those stops are served by hundreds of buses a day and will obviously get more riders than stops served by far fewer. On top of that, stop spacing can vary significantly between different routes. The 5, for example, can stop every 2-3 blocks as it travels up Phinney Ridge, while the E running next door stops every 5-10 blocks on Aurora, meaning that the E concentrates ridership into fewer stops and looks much more prominent in the data.

To make a fairer comparison of ridership across the region, I added two additional views. The "Riders / Bus" metric shows ridership on a per-bus basis, so that stops served by many buses a day are no longer overrepresented compared to stops served by far fewer. The "Heatmap" view aggregates stop-level data into hex bins, so that routes with closer stop spacing are no longer underrepresented. For more fine-grained exploration, I also added filters to slice the data by time of day, service period, and specific routes.

<a href="/ridership-map/" target="_blank">Open in full page</a>

<iframe src="/ridership-map/" style="width:100%; height:800px; border:none;"></iframe>

Switching to the heatmap view and the riders per bus metric paints a different picture than simply looking at raw ridership per stop. Downtown and U District are still prominent, but fast arterial routes like the A and E jump out in the data, and dense neighborhoods like Ballard and SLU become much more pronounced. SLU in particular stands out to me. Despite being notorious for car traffic and [very late buses](https://fixthel8.com/), it has some of the highest ridership per bus in the entire region.

Take a look at the neighborhoods you are familiar with. Are there corridors that rank higher or lower than you'd expect, or neighborhoods that seem underserved relative to their ridership or density?

### Data and Methodology

Stop and route data comes from King County Metro's [public GTFS feed](https://kingcounty.gov/en/dept/metro/rider-tools/mobile-and-web-apps/developers). Thanks to Michael Smith and Ross Bleakney of [Seattle Transit Blog](https://seattletransitblog.com) for pulling the per-stop ridership data.

In the heatmap view, ridership per stop is distributed across nearby hex bins using a Gaussian falloff. When calculating riders per bus, stops with very few runs are down-weighted so that a handful of peak-only trips don't overly influence the data.