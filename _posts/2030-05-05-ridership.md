---
layout: post
title: "Ridership"
date: 2026-01-01
categories: transit king-county-metro ridership
---

I've lived in a handful of neighborhoods across the greater Seattle area, and for my own personal convenience I've always tried to seek out a home with a frequent bus or two within walking distance. Over time I started to notice which stops fill up in the morning, when routes become standing-room-only, and which stops are nearly always empty. But that is only a narrow view into the ridership patterns of the few routes that I frequent. I started to wonder whether there was a way to see those same patterns across the entire region at once, rather than jut the tiny slice visible from my front door.

King County Metro is the largest provider of bus service in the region, and they provide a handy [rider dashboard](https://kingcounty.gov/en/dept/metro/about/data-and-reports) as well as an annual [system evaluation](https://kingcounty.gov/en/dept/metro/about/data-and-reports/performance-reports) for me to dive into route-level performance. This is great for looking into the performance of specific routes and especially to compare ridership over time, but it doesn't tell us about the spatial distribution of ridership: where are people already riding transit, and where would additional service be the most effective?

### Visualizing Ridership

To that end, I created an interactive map to visualize King County Metro ridership data across the entire service region. There are two primary ways to visualize the data: as a scatterplot on a per-stop basis, or aggregated into a heatmap. The map can be toggled between Riders per Day to see where existing ridership is strong, or riders per bus to see where additional service might pay off. The time-of-day filters allow us to compare peak vs off-peak demand, and the different datasets let us compare ridership across different service periods

Takeaways:
Looking at the hex map of riders per day, idership is heavily concentrated in downtown and the U District, but that's not really a fair comparison because so many buses pass through those neighborhoods every day. Looking at riders per bus paints a different story. Dense neighborhoods like Ballard

<a href="/ridership-map/" target="_blank">Open in full page</a>

<iframe src="/ridership-map/" style="width:100%; height:800px; border:none;"></iframe>

### Data and Methodology

Heatmap methodology: Ridership per stop is distributed in a gaussian distribution between the hexes. When calculating ridership per bus, routes with very few runs are down-weighted so that a handful of peak-only buses don't overly influence the per-bus figure