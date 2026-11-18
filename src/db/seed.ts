import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db, withDbRetry } from "./index.ts";
import {
  categories,
  liveStreams,
  newsArticles,
  notifications,
  organizations,
  presenters,
  programs,
  schedules,
  stations,
  users,
  videos,
} from "./schema.ts";

export function hashPassword(password: string): string {
  const salt = "rh_somaliland_1942";
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!hash) return false;
  const computed = hashPassword(password);
  if (computed.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

let seededPromise: Promise<void> | null = null;
let seededDone = false;

export async function ensureSeeded(): Promise<void> {
  if (seededDone) return;
  if (!seededPromise) {
    seededPromise = withDbRetry(() => runSeed())
      .then(() => {
        seededDone = true;
      })
      .catch((err) => {
        seededPromise = null;
        throw err;
      });
  }
  return seededPromise;
}

async function ensureCategoriesSeeded(stationId: string, now: string): Promise<void> {
  const existingCats = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories);
  if ((existingCats[0]?.count || 0) > 0) return;

  const defaultCats = [
    { id: "cat_news", name: "News", slug: "NEWS", icon_name: "newspaper", color_theme: "green", sort_order: 1, description: "National, regional, and international news bulletins." },
    { id: "cat_politics", name: "Politics", slug: "POLITICS", icon_name: "landmark", color_theme: "green", sort_order: 2, description: "Parliament, civic affairs, diplomacy, and public policy." },
    { id: "cat_business", name: "Business", slug: "BUSINESS", icon_name: "briefcase", color_theme: "rose", sort_order: 3, description: "Trade, livestock exports, markets, and entrepreneurship." },
    { id: "cat_education", name: "Education", slug: "EDUCATION", icon_name: "graduation-cap", color_theme: "green", sort_order: 4, description: "University lectures, schools, and study programs." },
    { id: "cat_culture", name: "Culture", slug: "CULTURE", icon_name: "drum", color_theme: "rose", sort_order: 5, description: "Somali poetry, oral history, folklore, and heritage." },
    { id: "cat_religion", name: "Religion", slug: "RELIGION", icon_name: "moon", color_theme: "green", sort_order: 6, description: "Islamic teachings, Friday sermons, and spiritual programs." },
    { id: "cat_entertainment", name: "Entertainment", slug: "ENTERTAINMENT", icon_name: "music", color_theme: "rose", sort_order: 7, description: "Classic Qaraami oud music, drama, and evening shows." },
    { id: "cat_agriculture", name: "Agriculture", slug: "AGRICULTURE", icon_name: "sprout", color_theme: "green", sort_order: 8, description: "Farming, pastoral life, climate, and water resilience." },
    { id: "cat_technology", name: "Technology", slug: "TECHNOLOGY", icon_name: "laptop", color_theme: "green", sort_order: 9, description: "Digital innovation, startups, and modern media." },
    { id: "cat_community", name: "Community", slug: "COMMUNITY", icon_name: "users", color_theme: "green", sort_order: 10, description: "Neighborhood voices, health, youth, and public service." },
    { id: "cat_sports", name: "Sports", slug: "SPORTS", icon_name: "trophy", color_theme: "rose", sort_order: 11, description: "Football leagues, athletics, and tournament coverage." },
  ];

  await db
    .insert(categories)
    .values(
      defaultCats.map((c) => ({
        ...c,
        station_id: stationId,
        image_url: "",
        status: "ACTIVE",
        created_date: now,
        updated_date: now,
        created_by_id: "usr_super_admin",
      }))
    )
    .onConflictDoNothing();
}

async function runSeed(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const orgId = "org_rh_01";
    const stationId = "stn_rh_01";

    const existing = await db.select({ count: sql<number>`count(*)::int` }).from(stations);
    const stationAlreadyExists = (existing[0]?.count || 0) > 0;

    if (!stationAlreadyExists) {
      await db
        .insert(organizations)
        .values({
          id: orgId,
          name: "Radio Hargeysa Public Broadcaster",
          slug: "radio-hargeysa",
          country: "Somaliland",
          city: "Hargeisa",
          contact_email: "desk@radiohargeysa.so",
          website: "https://radiohargeysa.so",
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        })
        .onConflictDoNothing();

      await db
        .insert(stations)
        .values({
          id: stationId,
          organization_id: orgId,
          name: "Radio Hargeysa",
          slug: "radio-hargeysa",
          tagline: "Codka Jamhuuriyadda Somaliland",
          description:
            "Founded in 1942, Radio Hargeysa is Somaliland's national public broadcaster serving listeners across the Horn of Africa and the global diaspora.",
          city: "Hargeisa",
          country: "Somaliland",
          founded_year: 1942,
          languages: ["so", "en", "ar"],
          logo_url: "",
          brand_color: "#047422",
          studio_name: "Studio 1",
          status: "ACTIVE",
          is_primary: true,
          features: {
            downloads_enabled: true,
            ai_enabled: true,
            emergency_enabled: true,
          },
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        })
        .onConflictDoNothing();
    }

    await ensureCategoriesSeeded(stationId, now);

    if (stationAlreadyExists) {
      return;
    }

    await db
      .insert(users)
      .values([
        {
          id: "usr_super_admin",
          uid: "usr_super_admin",
          email: "admin@radiohargeysa.so",
          password_hash: hashPassword("Admin123!"),
          full_name: "Sakariye Sead (Chiiro)",
          role: "admin",
          staff_role: "SUPER_ADMIN",
          account_status: "ACTIVE",
          station_id: stationId,
          verified: true,
          last_active_at: now,
          created_date: now,
          updated_date: now,
          created_by_id: "system",
        },
        {
          id: "usr_studio_producer",
          uid: "usr_studio_producer",
          email: "studio@radiohargeysa.so",
          password_hash: hashPassword("Studio123!"),
          full_name: "Khadra Ahmed",
          role: "user",
          staff_role: "PRODUCER",
          account_status: "ACTIVE",
          station_id: stationId,
          verified: true,
          last_active_at: now,
          created_date: now,
          updated_date: now,
          created_by_id: "system",
        },
        {
          id: "usr_listener",
          uid: "usr_listener",
          email: "listener@radiohargeysa.so",
          password_hash: hashPassword("Listener123!"),
          full_name: "Sakariye Hamud Osman",
          role: "user",
          staff_role: null,
          account_status: "ACTIVE",
          station_id: stationId,
          verified: true,
          last_active_at: now,
          created_date: now,
          updated_date: now,
          created_by_id: "system",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(presenters)
      .values([
        {
          id: "prs_khadra",
          station_id: stationId,
          full_name: "Khadra Ahmed",
          role_title: "Morning Show Host",
          bio: "Veteran broadcast journalist anchoring Subaxnimo from Studio 1 with morning headlines, civic dialogue, and regional correspondents.",
          photo_url: "/media/radio-studio.jpg",
          program_titles: ["Subaxnimo"],
          languages: ["so", "en"],
          email: "khadra@radiohargeysa.so",
          years_at_station: 11,
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prs_abdirahman",
          station_id: stationId,
          full_name: "Abdirahman Yusuf",
          role_title: "Senior News & Education Editor",
          bio: "Leads midday national news bulletins on Wararka and evening academic discussions on Education.",
          photo_url: "/media/classroom.jpg",
          program_titles: ["Wararka", "Education"],
          languages: ["so", "en", "ar"],
          email: "abdirahman@radiohargeysa.so",
          years_at_station: 9,
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prs_hibo",
          station_id: stationId,
          full_name: "Hibo Jama",
          role_title: "Arts & Evening Producer",
          bio: "Curates Somali music heritage, poetry recitals, and evening listener conversations on Caways.",
          photo_url: "/media/oud-culture.jpg",
          program_titles: ["Caways"],
          languages: ["so"],
          email: "hibo@radiohargeysa.so",
          years_at_station: 7,
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prs_yusuf",
          station_id: stationId,
          full_name: "Yusuf Ibrahim",
          role_title: "Sports Desk Lead",
          bio: "Covers domestic leagues, regional cups, and athletics across Somaliland and the Horn of Africa.",
          photo_url: "/media/stadium.jpg",
          program_titles: ["Sports"],
          languages: ["so", "en"],
          email: "yusuf@radiohargeysa.so",
          years_at_station: 6,
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prs_fadumo",
          station_id: stationId,
          full_name: "Fadumo Hassan",
          role_title: "Cultural Affairs Host",
          bio: "Preserves oral history, traditional suugaan poetry, and community storytelling on Duhur and Culture.",
          photo_url: "/media/oud-culture.jpg",
          program_titles: ["Duhur", "Culture"],
          languages: ["so", "ar"],
          email: "fadumo@radiohargeysa.so",
          years_at_station: 14,
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prs_mohamed",
          station_id: stationId,
          full_name: "Mohamed Ali",
          role_title: "Afternoon Community Host",
          bio: "Connects neighborhoods, traders, and youth voices every afternoon on Galab.",
          photo_url: "/media/hargeisa-sunset.jpg",
          program_titles: ["Galab"],
          languages: ["so", "en"],
          email: "mohamed@radiohargeysa.so",
          years_at_station: 8,
          status: "ACTIVE",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(programs)
      .values([
        {
          id: "prg_subaxnimo",
          station_id: stationId,
          title: "Subaxnimo",
          slug: "subaxnimo",
          description:
            "Radio Hargeysa's flagship morning program bringing verified news, morning press reviews, and live interviews with civic leaders.",
          category: "NEWS",
          cover_url: "/media/radio-studio.jpg",
          presenter_names: ["Khadra Ahmed"],
          schedule_text: "Mon–Sun · 07:00–09:00",
          language: "so",
          status: "PUBLISHED",
          is_featured: true,
          follower_count: 74,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_wararka",
          station_id: stationId,
          title: "Wararka",
          slug: "wararka",
          description:
            "Midday national news bulletin covering Somaliland regions, regional diplomacy, and economic updates.",
          category: "NEWS",
          cover_url: "/media/radio-studio.jpg",
          presenter_names: ["Abdirahman Yusuf"],
          schedule_text: "Daily · 12:00–12:30",
          language: "so",
          status: "PUBLISHED",
          is_featured: false,
          follower_count: 61,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_duhur",
          station_id: stationId,
          title: "Duhur",
          slug: "duhur",
          description:
            "Midday cultural reflections, heritage poetry, and listeners' call-in stories from across the republic.",
          category: "CULTURE",
          cover_url: "/media/oud-culture.jpg",
          presenter_names: ["Fadumo Hassan"],
          schedule_text: "Daily · 12:30–14:00",
          language: "so",
          status: "PUBLISHED",
          is_featured: false,
          follower_count: 146,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_galab",
          station_id: stationId,
          title: "Galab",
          slug: "galab",
          description:
            "Afternoon community magazine exploring local markets, urban life in Hargeisa, and public service updates.",
          category: "COMMUNITY",
          cover_url: "/media/hargeisa-sunset.jpg",
          presenter_names: ["Mohamed Ali"],
          schedule_text: "Daily · 15:00–17:00",
          language: "so",
          status: "PUBLISHED",
          is_featured: false,
          follower_count: 140,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_caways",
          station_id: stationId,
          title: "Caways",
          slug: "caways",
          description:
            "Evening arts, classic Qaraami oud recordings, contemporary literature, and live studio conversations.",
          category: "ENTERTAINMENT",
          cover_url: "/media/oud-culture.jpg",
          presenter_names: ["Hibo Jama"],
          schedule_text: "Daily · 18:00–20:00",
          language: "so",
          status: "PUBLISHED",
          is_featured: true,
          follower_count: 60,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_sports",
          station_id: stationId,
          title: "Sports",
          slug: "sports",
          description:
            "Daily sports desk covering regional football tournaments, club updates, and post-match analysis.",
          category: "SPORTS",
          cover_url: "/media/stadium.jpg",
          presenter_names: ["Yusuf Ibrahim"],
          schedule_text: "Daily · 20:00–21:00",
          language: "so",
          status: "PUBLISHED",
          is_featured: true,
          follower_count: 330,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_culture",
          station_id: stationId,
          title: "Culture",
          slug: "culture",
          description:
            "Archival treasures from Radio Hargeysa since 1942 alongside discussions on Somali language and folklore.",
          category: "CULTURE",
          cover_url: "/media/oud-culture.jpg",
          presenter_names: ["Fadumo Hassan"],
          schedule_text: "Daily · 21:00–22:00",
          language: "so",
          status: "PUBLISHED",
          is_featured: false,
          follower_count: 402,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "prg_education",
          station_id: stationId,
          title: "Education",
          slug: "education",
          description:
            "Evening learning hour featuring educators, university fellows, and study guidance for students.",
          category: "EDUCATION",
          cover_url: "/media/classroom.jpg",
          presenter_names: ["Abdirahman Yusuf"],
          schedule_text: "Daily · 22:00–23:00",
          language: "en",
          status: "PUBLISHED",
          is_featured: false,
          follower_count: 214,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
      ])
      .onConflictDoNothing();

    const slotTemplates = [
      { program_id: "prg_subaxnimo", program_title: "Subaxnimo", presenter_name: "Khadra Ahmed", start_time: "07:00", end_time: "09:00", studio: "Studio 1" },
      { program_id: "prg_wararka", program_title: "Wararka", presenter_name: "Abdirahman Yusuf", start_time: "12:00", end_time: "12:30", studio: "Studio 1" },
      { program_id: "prg_duhur", program_title: "Duhur", presenter_name: "Fadumo Hassan", start_time: "12:30", end_time: "14:00", studio: "Studio 2" },
      { program_id: "prg_galab", program_title: "Galab", presenter_name: "Mohamed Ali", start_time: "15:00", end_time: "17:00", studio: "Studio 1" },
      { program_id: "prg_caways", program_title: "Caways", presenter_name: "Hibo Jama", start_time: "18:00", end_time: "20:00", studio: "Studio 2" },
      { program_id: "prg_sports", program_title: "Sports", presenter_name: "Yusuf Ibrahim", start_time: "20:00", end_time: "21:00", studio: "Studio 1" },
      { program_id: "prg_culture", program_title: "Culture", presenter_name: "Fadumo Hassan", start_time: "21:00", end_time: "22:00", studio: "Studio 2" },
      { program_id: "prg_education", program_title: "Education", presenter_name: "Abdirahman Yusuf", start_time: "22:00", end_time: "23:00", studio: "Studio 1" },
    ];

    const scheduleRows = DAYS.flatMap((day, dIdx) =>
      slotTemplates.map((slot, sIdx) => ({
        id: `sch_${dIdx}_${sIdx}`,
        station_id: stationId,
        ...slot,
        day_of_week: day,
        is_recurring: true,
        status: "SCHEDULED",
        created_date: now,
        updated_date: now,
        created_by_id: "usr_super_admin",
      }))
    );
    await db.insert(schedules).values(scheduleRows).onConflictDoNothing();

    await db
      .insert(newsArticles)
      .values([
        {
          id: "nws_trade_fair",
          station_id: stationId,
          title: "Hargeisa trade fair opens with record exhibitor numbers",
          slug: "hargeisa-trade-fair-opens",
          category: "SOMALILAND",
          summary:
            "More than 240 local producers, technology startups, and regional cooperatives opened stalls at the annual Hargeisa trade fair.",
          body: "The annual Hargeisa Trade Fair opened this morning with record participation from regional entrepreneurs, agricultural cooperatives, and telecommunications providers.\n\nOrganizers noted strong interest in solar energy systems, livestock value-added products, and local software services built by university graduates.\n\nThe week-long exhibition continues through Friday with public policy panels and buyer-seller forums.",
          image_url: "/media/hargeisa-sunset.jpg",
          author: "Radio Hargeysa Newsroom",
          language: "en",
          published_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
          status: "PUBLISHED",
          is_breaking: true,
          view_count: 420,
          audio_url: "",
          is_demo: true,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "nws_football_squad",
          station_id: stationId,
          title: "National football team names squad for regional cup",
          slug: "national-football-team-squad",
          category: "SPORTS",
          summary:
            "Head coach announces a 23-player squad ahead of next week's regional tournament fixtures.",
          body: "The Somaliland Football Association confirmed the final 23-player roster ahead of the upcoming regional cup.\n\nTraining camp enters its final week in Hargeisa with morning conditioning sessions and tactical scrimmages open to supporters.",
          image_url: "/media/stadium.jpg",
          author: "Radio Hargeysa Newsroom",
          language: "en",
          published_at: new Date(Date.now() - 5 * 3600_000).toISOString(),
          status: "PUBLISHED",
          is_breaking: false,
          view_count: 318,
          audio_url: "",
          is_demo: true,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "nws_water_cooperation",
          station_id: stationId,
          title: "Regional ministers meet in Hargeisa on water cooperation",
          slug: "regional-ministers-water-cooperation",
          category: "POLITICS",
          summary:
            "Delegations reviewed urban water distribution expansion and rural borehole resilience ahead of the dry season.",
          body: "Regional water and infrastructure delegates convened in Hargeisa to review municipal pipeline upgrades and catchment management programs.\n\nJoint technical committees will publish quarterly progress briefings for district councils.",
          image_url: "/media/radio-studio.jpg",
          author: "Radio Hargeysa Newsroom",
          language: "en",
          published_at: new Date(Date.now() - 9 * 3600_000).toISOString(),
          status: "PUBLISHED",
          is_breaking: false,
          view_count: 204,
          audio_url: "",
          is_demo: true,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "nws_livestock_exports",
          station_id: stationId,
          title: "Livestock exports resume after seasonal pause",
          slug: "livestock-exports-resume",
          category: "BUSINESS",
          summary:
            "Port authorities in Berbera report steady vessel schedules as seasonal export inspections conclude.",
          body: "Veterinary inspection teams at Berbera Port cleared the first shipments of the new export window.\n\nTraders expect steady demand across Gulf markets over the coming quarter.",
          image_url: "/media/hargeisa-sunset.jpg",
          author: "Radio Hargeysa Newsroom",
          language: "en",
          published_at: new Date(Date.now() - 16 * 3600_000).toISOString(),
          status: "PUBLISHED",
          is_breaking: false,
          view_count: 279,
          audio_url: "",
          is_demo: true,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(videos)
      .values([
        {
          id: "vid_cup_highlights",
          station_id: stationId,
          program_id: "prg_sports",
          program_title: "Sports",
          title: "News video: Regional cup semi-final highlights",
          description:
            "Match highlights and pitchside interviews following the semi-final clash in Hargeisa.",
          thumbnail_url: "/media/stadium.jpg",
          video_url: "",
          hls_url: "",
          duration_seconds: 265,
          kind: "NEWS",
          tags: ["sports", "football", "highlights"],
          published_at: new Date(Date.now() - 4 * 3600_000).toISOString(),
          status: "PUBLISHED",
          view_count: 185,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "vid_studio_session",
          station_id: stationId,
          program_id: "prg_subaxnimo",
          program_title: "Subaxnimo",
          title: "Inside Radio Hargeysa: Studio 1 in session",
          description:
            "Behind the glass with Khadra Ahmed and the morning production desk during Subaxnimo.",
          thumbnail_url: "/media/radio-studio.jpg",
          video_url: "",
          hls_url: "",
          duration_seconds: 410,
          kind: "STUDIO",
          tags: ["studio", "morning", "behind-the-scenes"],
          published_at: new Date(Date.now() - 12 * 3600_000).toISOString(),
          status: "PUBLISHED",
          view_count: 142,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "vid_oud_heritage",
          station_id: stationId,
          program_id: "prg_culture",
          program_title: "Culture",
          title: "Cultural Heritage Evening — Oud & Poetry",
          description:
            "Acoustic kaban performance and Somali poetic commentary recorded in Studio 2.",
          thumbnail_url: "/media/oud-culture.jpg",
          video_url: "",
          hls_url: "",
          duration_seconds: 540,
          kind: "RECORDED",
          tags: ["culture", "oud", "poetry"],
          published_at: new Date(Date.now() - 24 * 3600_000).toISOString(),
          status: "PUBLISHED",
          view_count: 230,
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(liveStreams)
      .values([
        {
          id: "stm_audio_primary",
          station_id: stationId,
          name: "Radio Hargeysa Audio Stream",
          kind: "AUDIO",
          primary_url: "",
          backup_url: "",
          rtmp_ingest_url: "",
          hls_output_url: "",
          bitrate_kbps: 64,
          codec: "AAC",
          qualities: ["32", "64", "128"],
          status: "OFFLINE",
          health: "GOOD",
          listener_count: 0,
          viewer_count: 0,
          latency_ms: 0,
          uptime_seconds: 0,
          backup_status: "OFFLINE",
          recording_status: "IDLE",
          is_primary: true,
          is_placeholder: true,
          provider: "icecast",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
        {
          id: "stm_video_studio",
          station_id: stationId,
          name: "Radio Hargeysa Video Stream",
          kind: "VIDEO",
          primary_url: "",
          backup_url: "",
          rtmp_ingest_url: "",
          hls_output_url: "",
          bitrate_kbps: 1200,
          codec: "H.264",
          qualities: ["360", "720", "1080"],
          status: "OFFLINE",
          health: "GOOD",
          listener_count: 0,
          viewer_count: 0,
          latency_ms: 0,
          uptime_seconds: 0,
          backup_status: "OFFLINE",
          recording_status: "IDLE",
          is_primary: false,
          is_placeholder: true,
          provider: "hls",
          created_date: now,
          updated_date: now,
          created_by_id: "usr_super_admin",
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(notifications)
      .values({
        id: "ntf_welcome",
        type: "NEW_PROGRAM",
        title: "Welcome to Radio Hargeysa",
        body: "Live daily schedule, newsroom dispatches, and Studio 1 archives since 1942.",
        href: "/mobile/schedule",
        station_id: stationId,
        user_id: null,
        is_read: false,
        created_date: now,
        updated_date: now,
        created_by_id: "usr_super_admin",
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Failed to seed database:", error);
    throw new Error("Database initialization failed. Please try again later.", {
      cause: error,
    });
  }
}
