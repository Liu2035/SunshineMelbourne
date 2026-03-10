# Acceptance Criteria

**Project:** The Generational Shift in Sun-Safety Attitudes  
**Unit:** FIT5120 Industry Experience Studio — Onboarding Iteration  
**Target Audience:** Young Australians (Gen Z & Alpha) in Victoria, Australia  
**Tech Stack:** Vue 3  
**Scope:** 3-page web application

---

## Application Pages

| Page | Content |
|------|---------|
| Page 1 — UV Today | Real-time UV index by location + clothing recommendations (US1.1, US3.3) |
| Page 2 — Awareness | Skin cancer data visualisations + skin tone UV guide (US2.1, US2.2) |
| Page 3 — Protection | Sunscreen dosage calculator + reapplication reminder (US3.1, US3.2) |

---

## Epic 1.0 — Track UV Levels

### US1.1 — Real-Time Localised UV Level Alerts
> *As a young adult spending time outdoors, I want to receive real-time, localised UV level alerts so that I know exactly when radiation becomes dangerous and can take immediate action to protect my skin.*

**Priority:** Must Have

**AC1.1.1**
- **Given** a user opens Page 1 (UV Today),
- **When** they allow browser location access,
- **Then** the page fetches and displays the current UV index for their location via the OpenWeatherMap API.

**AC1.1.2**
- **Given** the UV index has been retrieved,
- **When** the value is displayed on screen,
- **Then** it is accompanied by a colour-coded risk label: Low (0–2), Moderate (3–5), High (6–7), Very High (8–10), or Extreme (11+).

**AC1.1.3**
- **Given** the UV index is displayed,
- **When** the user views the alert,
- **Then** a short plain-language message is shown describing what the UV level means (e.g., "High UV — Protect your skin. Apply sunscreen and seek shade between 10am–3pm.").

**AC1.1.4**
- **Given** the user denies location access,
- **When** the page loads,
- **Then** a text input is shown allowing the user to manually enter a city or suburb to retrieve UV data.

**AC1.1.5**
- **Given** the API call fails or returns no data,
- **When** the result area would normally display,
- **Then** a friendly error message is shown (e.g., "Unable to retrieve UV data. Please try again.") and no broken UI is visible.

---

## Epic 2.0 — Raising Awareness

### US2.1 — Australian UV Impacts and Skin Cancer Data Visualisations
> *As a young adult, I want to understand Australia's UV impacts and skin cancer trends so that I can raise awareness to my friends.*

**Priority:** Must Have

**AC2.1.1**
- **Given** a user navigates to Page 2 (Awareness),
- **When** the page loads,
- **Then** at least two charts are displayed using data from the Australian open datasets (Cancer Incidence and/or Cancer Mortality CSVs, 1982–2017).

**AC2.1.2**
- **Given** a chart is displayed,
- **When** the user hovers over or taps a data point,
- **Then** a tooltip shows the exact value for that data point.

**AC2.1.3**
- **Given** a chart is displayed,
- **When** the user views the chart,
- **Then** it has a title, labelled axes, and a legend where applicable.

**AC2.1.4**
- **Given** the charts are displayed,
- **When** the user views the page,
- **Then** each chart includes a note attributing the data source (e.g., "Source: Australian Institute of Health and Welfare, CC BY 3.0 AU").

---

### US2.2 — Skin Colour and UV Absorption Guide
> *As a young adult, I want to understand the relationship between my skin colour and UV absorption so that I can confidently educate my friends and shift our group's attitude toward sun protection.*

**Priority:** Should Have

**AC2.2.1**
- **Given** a user is on Page 2 (Awareness),
- **When** they select a skin type from a dropdown or set of options (Fitzpatrick Types I–VI),
- **Then** the page displays a personalised UV risk note for that skin type (e.g., approximate time to burn at a given UV level).

**AC2.2.2**
- **Given** a skin type is selected,
- **When** the result is shown,
- **Then** it includes a specific sun protection recommendation for that skin type rather than a generic message.

**AC2.2.3**
- **Given** the page first loads,
- **When** no skin type has been selected,
- **Then** a prompt is shown asking the user to select their skin type to see personalised advice.

---

## Epic 3.0 — Prevention

### US3.1 — Sunscreen Dosage Calculator
> *As a young adult, I want to translate the UV Index numbers into a recommended sunscreen dosage so that I can confidently protect myself against Australian UV levels without the guesswork.*

**Priority:** Should Have

**AC3.1.1**
- **Given** a user is on Page 3 (Protection),
- **When** they enter or select a UV index value,
- **Then** the calculator displays a recommended sunscreen dosage in teaspoons or pump counts for full-body application.

**AC3.1.2**
- **Given** a UV index value is entered,
- **When** the result is displayed,
- **Then** the recommended SPF level (e.g., SPF 30+ or SPF 50+) is shown alongside the dosage.

**AC3.1.3**
- **Given** the user changes the UV index input,
- **When** the new value is entered,
- **Then** the dosage and SPF recommendation update immediately without a page reload.

---

### US3.2 — Sunscreen Reapplication Reminder
> *As a young adult, I would like to track my sunscreen reminders so that I can ensure continuous protection.*

**Priority:** Should Have

**AC3.2.1**
- **Given** a user is on Page 3 (Protection),
- **When** they click a "Start Reminder" button,
- **Then** a countdown timer starts, defaulting to a 2-hour reapplication interval.

**AC3.2.2**
- **Given** the countdown timer reaches zero,
- **When** the time has elapsed,
- **Then** an on-screen alert is shown prompting the user to reapply sunscreen.

**AC3.2.3**
- **Given** the reminder alert is showing,
- **When** the user clicks "Reset",
- **Then** the countdown timer restarts from the beginning.

---

### US3.3 — Clothing Recommendations Based on UV Index
> *As a young adult, I want to select appropriate clothing to wear depending on the UV index so that I can protect my skin from the sun.*

**Priority:** Must Have

**AC3.3.1**
- **Given** a UV index value has been retrieved or entered,
- **When** the user views Page 1 (UV Today),
- **Then** a clothing recommendation list is displayed showing items appropriate for that UV level (e.g., hat, sunglasses, long sleeves).

**AC3.3.2**
- **Given** clothing recommendations are shown,
- **When** the UV index changes (e.g., user enters a different location),
- **Then** the clothing recommendations update to match the new UV level.

**AC3.3.3**
- **Given** clothing recommendations are displayed,
- **When** the user views each item,
- **Then** a brief reason is shown for why that item is recommended (e.g., "Wide-brim hat — protects face, neck, and ears").

---

## General Acceptance Criteria

**GEN-01**
- **Given** the application is submitted,
- **When** mentors access the build URL,
- **Then** the application is live, publicly accessible, and the URL does not change after submission.

**GEN-02**
- **Given** a mentor reviews the application,
- **When** they interact with any page,
- **Then** no unhandled errors, broken layouts, or blank sections are visible.

**GEN-03**
- **Given** a user opens the application on a mobile device,
- **When** any of the 3 pages loads,
- **Then** all content is readable and usable without horizontal scrolling.

**GEN-04**
- **Given** the application is built,
- **When** the codebase is reviewed,
- **Then** all Vue 3 components are clearly named and the project structure is organised (e.g., `/components`, `/views`, `/assets`).

**GEN-05**
- **Given** the build is reviewed against the Kanban board,
- **When** a feature exists in the application,
- **Then** a corresponding user story and these acceptance criteria exist in LeanKit.

---

*This document is the reference used for acceptance testing during the Onboarding Iteration build review and should be mirrored in LeanKit on each user story card.*
