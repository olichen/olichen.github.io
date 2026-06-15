---
layout: post
title: "Ridership"
date: 2026-01-01
categories: transit king-county-metro ridership
---

I like riding the bus. I find it a more pleasant experience than driving through the city (and certainly much better than circling for parking!). Sitting on the bus, I feel like a participant in the ebb and flow of the city alongside everyone else, rather than sealed off from it. And the more time I spend riding, the more I find myself thinking about how the system is working, not just for me but for everyone who travels through the city. In a city growing as fast as Seattle, getting transit right is a practical necessity. City streets simply cannot absorb the number of trips that Seattleites need to make.

Over time, I've gotten a sense for the comings and goings of the routes that pass by my home: where people get on, where people get off, and when the bus fills up and empties out. Seeing that, I wondered if I could get that same context more broadly, across the entire city or even the entire region, rather than just the tiny slice visible from my front door.

King County Metro publishes a [rider dashboard](https://kingcounty.gov/en/dept/metro/about/data-and-reports) as well as an annual [system evaluation](https://kingcounty.gov/en/dept/metro/about/data-and-reports/performance-reports) where you can dive into route-level performance. Those resources are great for looking into the performance of specific routes or for comparing changes in ridership over time, but they don't tell us about the spatial distribution of ridership: where are people already riding transit, and where might additional service be the most useful?

### Visualizing Ridership

To start, I created a scatterplot of ridership on a per-stop basis. That illuminated the obvious: ridership is highest in downtown Seattle, especially on 3rd Ave, and in University District, especially on and near UW campus. But that isn't an entirely fair comparison: a bus stop served by hundreds of buses a day will obviously get more riders than one served by very few, and streets with closely spaced stops will have lower ridership since riders will split between many separate bus stops.

To make a fairer comparison across the region, I added two additional views. The "Riders / Bus" metric breaks ridership down on a per-bus basis, so that stops with a lot of service are no longer overrepresented. The "Heatmap" view aggregates stop-level data into hex bins, so that routes with closer stop spacing aren't underrepresented either. Additional filters let you slice the data by time of day, service period, and specific routes.

<a href="/ridership-map/" target="_blank">Open in full page</a>

<iframe src="/ridership-map/" style="width:100%; height:800px; border:none;"></iframe>

Switching to the heatmap view by riders per bus paints a different picture than the raw ridership numbers. Fast arterial routes like the A and E jump out in the data, and dense neighborhoods like Ballard and SLU become much more prominent. SLU in particular stands out to me. Despite being notorious for car traffic and [very late buses](https://fixthel8.com/), it has some of the highest ridership per bus in the entire region.

Take a look at the neighborhoods you are familiar with. Do ridership patterns match what you would expect, or are there corridors that surprise you? I'd be especially curious as to whether any other neighborhoods stand out as underserved relative to their ridership.

### Data and Methodology

Thanks to Michael Smith and Ross Bleakney of [Seattle Transit Blog](https://seattletransitblog.com) for the stop-level data

Heatmap hexmap methodology: Ridership per stop is distributed in a gaussian distribution between the hexes. When calculating ridership per bus, routes with very few runs are down-weighted so that a handful of peak-only buses don't overly influence the per-bus figure.