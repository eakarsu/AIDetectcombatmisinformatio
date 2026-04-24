const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Seed Users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ('admin@factcheck.org', $1, 'Admin User', 'admin'),
      ('sarah@factcheck.org', $1, 'Sarah Chen', 'senior_checker'),
      ('marcus@factcheck.org', $1, 'Marcus Johnson', 'fact_checker'),
      ('elena@factcheck.org', $1, 'Elena Rodriguez', 'fact_checker'),
      ('james@factcheck.org', $1, 'James Wilson', 'analyst')
    `, [hashedPassword]);
    console.log('Users seeded');

    // Seed Categories
    await client.query(`
      INSERT INTO categories (name, description, color, claim_count) VALUES
      ('Health & Medicine', 'Claims related to health, medicine, vaccines, and medical treatments', '#EF4444', 245),
      ('Politics', 'Political claims, election-related misinformation, and policy claims', '#3B82F6', 389),
      ('Science & Technology', 'Claims about scientific discoveries, tech, and climate change', '#10B981', 178),
      ('Economy & Finance', 'Economic claims, market misinformation, and financial scams', '#F59E0B', 156),
      ('Social Media Hoaxes', 'Viral social media posts, chain messages, and fabricated stories', '#8B5CF6', 412),
      ('International Affairs', 'Claims about global events, foreign policy, and international relations', '#06B6D4', 134),
      ('Environment & Climate', 'Environmental claims, climate denial, and ecological misinformation', '#22C55E', 201),
      ('Education', 'Claims about education policy, curriculum, and academic research', '#EC4899', 87),
      ('Celebrity & Entertainment', 'Fake celebrity news, entertainment industry rumors', '#F97316', 298),
      ('Conspiracy Theories', 'Widespread conspiracy theories and unfounded speculation', '#DC2626', 567),
      ('Military & Defense', 'Claims about military operations and defense matters', '#6366F1', 89),
      ('Food & Agriculture', 'Claims about food safety, GMOs, and agricultural practices', '#84CC16', 145),
      ('Legal & Justice', 'Claims about legal proceedings, laws, and justice system', '#A855F7', 112),
      ('Immigration', 'Claims related to immigration, border security, and refugee issues', '#0EA5E9', 203),
      ('Public Safety', 'Claims about crime statistics, public safety, and emergencies', '#F43F5E', 176)
    `);
    console.log('Categories seeded');

    // Seed Sources
    await client.query(`
      INSERT INTO sources (name, url, credibility_score, type, description, total_claims, verified_claims, false_claims) VALUES
      ('Reuters', 'https://reuters.com', 9.5, 'news_agency', 'International news organization known for factual reporting', 450, 438, 2),
      ('Associated Press', 'https://apnews.com', 9.4, 'news_agency', 'Nonprofit news agency with global reach', 380, 371, 1),
      ('InfoWars', 'https://infowars.com', 1.2, 'blog', 'Known for spreading conspiracy theories and misinformation', 890, 45, 756),
      ('NaturalNews', 'https://naturalnews.com', 1.5, 'blog', 'Pseudoscience and health misinformation site', 670, 34, 589),
      ('BBC News', 'https://bbc.com/news', 9.1, 'news_outlet', 'British public broadcaster with global coverage', 520, 498, 5),
      ('The Onion', 'https://theonion.com', 2.0, 'satire', 'Satirical news site often mistaken for real news', 200, 0, 0),
      ('Facebook Posts', 'https://facebook.com', 3.5, 'social_media', 'User-generated content platform with viral misinformation', 2300, 456, 1200),
      ('Twitter/X Posts', 'https://x.com', 3.8, 'social_media', 'Microblogging platform with rapid information spread', 1890, 378, 980),
      ('WhatsApp Forwards', NULL, 2.1, 'messaging', 'Encrypted messaging platform with chain messages', 890, 67, 678),
      ('YouTube Videos', 'https://youtube.com', 4.0, 'video_platform', 'Video platform with both credible and misleading content', 1560, 412, 780),
      ('Telegram Channels', 'https://telegram.org', 2.8, 'messaging', 'Messaging platform with unmoderated channels', 670, 89, 456),
      ('TikTok', 'https://tiktok.com', 3.2, 'social_media', 'Short-form video platform with viral misinformation', 1200, 234, 678),
      ('Wikipedia', 'https://wikipedia.org', 7.8, 'encyclopedia', 'Collaborative encyclopedia with editorial oversight', 340, 298, 12),
      ('PubMed', 'https://pubmed.ncbi.nlm.nih.gov', 9.6, 'academic', 'Database of biomedical and life sciences literature', 120, 118, 0),
      ('Reddit', 'https://reddit.com', 4.2, 'social_media', 'Social news platform with community-driven moderation', 980, 234, 390)
    `);
    console.log('Sources seeded');

    // Seed Claims
    await client.query(`
      INSERT INTO claims (title, content, source_id, category_id, status, priority, urgency_score, spread_rate, reach, origin_url, assigned_to) VALUES
      ('COVID-19 vaccine contains microchips', 'Viral claim alleges that COVID-19 vaccines contain microchip tracking devices implanted by tech companies for mass surveillance.', 7, 1, 'in_review', 'critical', 9.8, 45000, 2300000, 'https://facebook.com/post/12345', 'Sarah Chen'),
      ('Election machines switched votes in swing states', 'Claims circulating that voting machines in key swing states systematically switched votes from one candidate to another during the 2024 election.', 8, 2, 'debunked', 'critical', 9.5, 38000, 1800000, 'https://x.com/post/67890', 'Marcus Johnson'),
      ('5G towers cause cancer and COVID symptoms', 'Widespread claim that 5G cellular towers emit radiation causing cancer and are responsible for COVID-19-like symptoms in nearby residents.', 11, 3, 'in_review', 'high', 8.7, 22000, 950000, 'https://telegram.org/channel/health', 'Elena Rodriguez'),
      ('Government hiding alien contact since 1947', 'Resurfacing claim that world governments have been hiding evidence of extraterrestrial contact since the Roswell incident in 1947.', 12, 10, 'debunked', 'medium', 6.2, 15000, 780000, 'https://tiktok.com/video/11111', NULL),
      ('New superfood cures all types of cancer', 'Viral posts claim that a newly discovered Amazonian berry can cure all forms of cancer within weeks, rendering chemotherapy obsolete.', 4, 1, 'pending', 'high', 8.9, 28000, 1200000, 'https://naturalnews.com/article/555', 'Sarah Chen'),
      ('Major bank secretly filing for bankruptcy', 'Anonymous sources claim that a major US bank is secretly preparing bankruptcy filings and customer deposits are at risk.', 8, 4, 'investigating', 'critical', 9.2, 32000, 1500000, 'https://x.com/post/22222', 'James Wilson'),
      ('Climate change data fabricated by scientists', 'Claim that climate scientists worldwide have been systematically fabricating temperature data to secure research funding.', 3, 7, 'debunked', 'high', 7.8, 18000, 890000, 'https://infowars.com/article/333', 'Marcus Johnson'),
      ('New law bans homeschooling nationwide', 'Viral claim that a new federal law has been passed banning all homeschooling across the United States effective immediately.', 7, 8, 'debunked', 'medium', 6.5, 12000, 560000, 'https://facebook.com/post/44444', 'Elena Rodriguez'),
      ('Celebrity death hoax - major actor', 'Widespread social media posts claiming a major Hollywood actor has died, with fabricated news articles and fake hospital statements.', 12, 9, 'debunked', 'high', 7.2, 52000, 3400000, 'https://tiktok.com/video/55555', NULL),
      ('Water fluoridation is government mind control', 'Long-running conspiracy theory resurfaces claiming water fluoridation is a government program for mass population control.', 9, 10, 'debunked', 'low', 4.5, 5000, 230000, NULL, NULL),
      ('Immigrants responsible for 80% of crime', 'Claim circulating that immigrants are responsible for 80 percent of all violent crime in the country, citing fabricated statistics.', 7, 14, 'in_review', 'high', 8.4, 25000, 1100000, 'https://facebook.com/post/66666', 'Sarah Chen'),
      ('AI will replace all jobs within 2 years', 'Sensationalist claim that artificial intelligence will completely replace all human jobs within the next two years.', 8, 3, 'investigating', 'medium', 5.8, 9000, 450000, 'https://x.com/post/77777', 'James Wilson'),
      ('Secret military base found on Google Maps', 'Claims that a user discovered a hidden military base using Google Maps satellite imagery showing unusual structures.', 15, 11, 'pending', 'low', 3.8, 7000, 340000, 'https://reddit.com/r/conspiracy/888', NULL),
      ('Organic food proven to extend lifespan by 20 years', 'Viral claim that a new study proves eating exclusively organic food extends human lifespan by 20 years.', 4, 12, 'pending', 'medium', 6.1, 14000, 670000, 'https://naturalnews.com/article/999', 'Elena Rodriguez'),
      ('Supreme Court secretly overturned landmark ruling', 'False claim that the Supreme Court has secretly overturned a major landmark ruling in a closed-door session.', 11, 13, 'debunked', 'high', 7.9, 20000, 920000, 'https://telegram.org/channel/legal', 'Marcus Johnson'),
      ('Drinking bleach cures viral infections', 'Dangerous claim promoting ingestion of bleach or similar chemicals as a cure for viral infections.', 9, 1, 'debunked', 'critical', 9.9, 35000, 1600000, NULL, 'Sarah Chen'),
      ('Foreign nation hacked national power grid', 'Unverified claim that a foreign nation successfully hacked the national power grid and can cause blackouts at will.', 11, 6, 'investigating', 'critical', 9.0, 27000, 1300000, 'https://telegram.org/channel/security', 'James Wilson'),
      ('New tax law takes 50% of all income', 'Viral social media claim that a newly passed tax law will take 50% of all income regardless of earnings bracket.', 7, 4, 'pending', 'high', 7.5, 16000, 750000, 'https://facebook.com/post/10101', NULL)
    `);
    console.log('Claims seeded');

    // Seed Fact Checks
    await client.query(`
      INSERT INTO fact_checks (claim_id, verdict, summary, evidence, sources_used, checker_name, confidence_score, methodology) VALUES
      (2, 'false', 'No evidence of systematic vote switching in any swing state. Multiple audits and hand recounts confirmed machine accuracy.', 'State audit reports from AZ, GA, MI, PA, and WI all confirmed results within normal margins. CISA confirmed no evidence of compromised voting systems.', 'CISA, State election boards, AP Vote Count', 'Marcus Johnson', 9.8, 'Cross-referenced official audit reports with independent monitoring data'),
      (4, 'false', 'No credible evidence of government concealment of alien contact. Roswell incident officially explained as weather balloon/Project Mogul.', 'US Air Force reports from 1994 and 1997 detail Project Mogul. No credible whistleblower testimony has been verified.', 'US Air Force, Smithsonian Institute, SETI', 'Elena Rodriguez', 9.2, 'Historical document review and expert consultation'),
      (7, 'false', 'Climate data has been independently verified by multiple agencies worldwide. No evidence of systematic fabrication.', 'NASA, NOAA, Met Office, and JMA independently collect and verify temperature data using different methodologies.', 'NASA GISS, NOAA NCEI, UK Met Office, Japan Meteorological Agency', 'Marcus Johnson', 9.7, 'Multi-source data verification and expert interviews'),
      (8, 'false', 'No federal law banning homeschooling has been proposed or passed. Homeschooling remains legal in all 50 states.', 'Congressional records show no such legislation. Department of Education confirms homeschooling status unchanged.', 'Congress.gov, Dept of Education, HSLDA', 'Elena Rodriguez', 9.9, 'Legislative record search and official source verification'),
      (9, 'false', 'The celebrity in question is alive and well. The actor posted verified social media content after the hoax began.', 'Actor posted verified video response. Representatives confirmed wellbeing. Original articles traced to fake news sites.', 'Actor official social media, talent agency, domain registration records', 'Sarah Chen', 9.5, 'Direct source verification and digital forensics'),
      (10, 'false', 'Water fluoridation is a well-studied public health measure endorsed by WHO, ADA, and CDC for dental health.', 'Decades of peer-reviewed research support safety. CDC lists fluoridation among top 10 public health achievements of 20th century.', 'WHO, CDC, ADA, Cochrane Reviews', 'Marcus Johnson', 9.8, 'Systematic review of scientific literature'),
      (15, 'false', 'No secret Supreme Court sessions occurred. All rulings are publicly documented and announced.', 'Supreme Court docket is publicly available. Court procedures require public announcement of all decisions.', 'Supreme Court official records, SCOTUSblog, legal scholars', 'Marcus Johnson', 9.9, 'Official record verification'),
      (16, 'false', 'Ingesting bleach is extremely dangerous and can cause death. No legitimate medical research supports this claim.', 'FDA, WHO, and Poison Control all warn against ingesting bleach. Multiple hospitalizations reported from following this advice.', 'FDA, WHO, American Association of Poison Control Centers, peer-reviewed toxicology literature', 'Sarah Chen', 10.0, 'Medical expert consultation and official health agency review'),
      (1, 'false', 'COVID-19 vaccines do not contain microchips. Vaccine ingredients are publicly listed and verified by multiple independent labs.', 'FDA ingredient lists, independent lab analyses, and the physical impossibility of injecting trackable microchips through vaccine needles.', 'FDA, CDC, independent laboratory analyses, MIT Technology Review', 'Sarah Chen', 9.9, 'Ingredient verification, expert consultation, and technical feasibility analysis'),
      (3, 'false', '5G operates within safe radiation limits. No causal link between 5G and cancer or COVID-19. 5G frequencies are non-ionizing.', 'WHO, ICNIRP safety guidelines, peer-reviewed EMF research, and the fact that COVID-19 spread in areas without 5G.', 'WHO, ICNIRP, IEEE, peer-reviewed EMF studies', 'Elena Rodriguez', 9.6, 'Scientific literature review and expert panel consultation'),
      (11, 'in_review', 'Official crime statistics show immigrants commit crimes at lower rates than native-born citizens. The 80% figure has no basis in any government data.', 'DOJ, FBI UCR data, and multiple peer-reviewed criminology studies consistently show lower crime rates among immigrant populations.', 'FBI UCR, DOJ statistics, Cato Institute research', 'Sarah Chen', 8.5, 'Statistical analysis of official crime data'),
      (5, 'in_review', 'No peer-reviewed study supports claims of a cancer-curing berry. The referenced study does not exist in any medical database.', 'PubMed search returns no results. NCI has no record of such findings. The product website sells supplements.', 'PubMed, NCI, FDA database', 'Sarah Chen', 8.8, 'Medical database search and commercial interest analysis'),
      (6, 'investigating', 'Major banks current financial filings show no indication of bankruptcy preparation. Stock prices and credit ratings remain stable.', 'SEC filings, credit rating agencies, Federal Reserve reports all show stable financial position.', 'SEC EDGAR, Moodys, S&P, Federal Reserve', 'James Wilson', 7.5, 'Financial document analysis and market data review'),
      (17, 'investigating', 'Cybersecurity agencies report no confirmed breach of national power grid systems. Ongoing investigation into probe attempts.', 'CISA and DOE confirm no successful breach. Reports of scanning activity under investigation.', 'CISA, DOE, NSA cybersecurity advisories', 'James Wilson', 6.8, 'Cybersecurity incident analysis and official source verification'),
      (12, 'in_review', 'AI advancement is rapid but complete job replacement within 2 years is not supported by any credible economic analysis or AI research.', 'McKinsey, World Economic Forum, and leading AI researchers project gradual transformation over decades, not sudden replacement.', 'McKinsey Global Institute, WEF Future of Jobs Report, AI researchers', 'James Wilson', 8.0, 'Economic analysis and expert consensus review')
    `);
    console.log('Fact checks seeded');

    // Seed Trending Topics
    await client.query(`
      INSERT INTO trending_topics (topic, description, mention_count, growth_rate, risk_level, category) VALUES
      ('Vaccine Side Effects', 'Exaggerated claims about vaccine side effects spreading across multiple platforms', 45000, 23.5, 'critical', 'Health'),
      ('Election Integrity', 'Claims about election fraud and voting system vulnerabilities', 38000, 18.2, 'critical', 'Politics'),
      ('AI Deepfakes', 'Concerns about AI-generated deepfake videos of political figures', 32000, 45.8, 'high', 'Technology'),
      ('Climate Denial', 'Coordinated campaign denying climate change scientific consensus', 28000, 12.3, 'high', 'Environment'),
      ('Bank Collapse Rumors', 'Unfounded rumors about imminent bank failures causing panic', 25000, 35.6, 'critical', 'Finance'),
      ('Miracle Cure Claims', 'Various miracle cure claims for chronic diseases', 22000, 15.7, 'high', 'Health'),
      ('Immigration Statistics', 'Manipulated statistics about immigration and crime', 20000, 19.4, 'high', 'Immigration'),
      ('5G Health Concerns', '5G conspiracy theories linking to health issues', 18000, -5.2, 'medium', 'Technology'),
      ('GMO Dangers', 'Claims about genetically modified foods being dangerous', 15000, 8.3, 'medium', 'Food Safety'),
      ('Government Surveillance', 'Claims about mass government surveillance programs', 14000, 11.2, 'medium', 'Privacy'),
      ('Cryptocurrency Scams', 'Fake cryptocurrency investment opportunities and pump-and-dump schemes', 35000, 42.1, 'critical', 'Finance'),
      ('Water Contamination', 'Exaggerated claims about water supply contamination in various cities', 12000, 7.8, 'medium', 'Environment'),
      ('Education Indoctrination', 'Claims about schools pushing political ideologies on children', 16000, 14.5, 'high', 'Education'),
      ('Military Operations', 'False claims about secret military operations domestically', 9000, 6.1, 'medium', 'Military'),
      ('Pharmaceutical Conspiracies', 'Claims that pharmaceutical companies suppress natural cures for profit', 21000, 16.9, 'high', 'Health')
    `);
    console.log('Trending topics seeded');

    // Seed Team Members
    await client.query(`
      INSERT INTO team_members (name, email, role, specialization, claims_reviewed, accuracy_rate, status) VALUES
      ('Sarah Chen', 'sarah@factcheck.org', 'Senior Fact-Checker', 'Health & Science', 1245, 98.70, 'active'),
      ('Marcus Johnson', 'marcus@factcheck.org', 'Fact-Checker', 'Politics & Elections', 892, 97.30, 'active'),
      ('Elena Rodriguez', 'elena@factcheck.org', 'Fact-Checker', 'Technology & Environment', 756, 96.80, 'active'),
      ('James Wilson', 'james@factcheck.org', 'Analyst', 'Finance & Economics', 534, 95.50, 'active'),
      ('Aisha Patel', 'aisha@factcheck.org', 'Junior Fact-Checker', 'Social Media & Viral Content', 312, 94.20, 'active'),
      ('David Kim', 'david@factcheck.org', 'Senior Analyst', 'International Affairs', 678, 97.80, 'active'),
      ('Maria Santos', 'maria@factcheck.org', 'Research Lead', 'Conspiracy Theories', 1089, 99.10, 'active'),
      ('Robert Taylor', 'robert@factcheck.org', 'Fact-Checker', 'Legal & Government', 445, 96.50, 'on_leave'),
      ('Lisa Wang', 'lisa@factcheck.org', 'Data Analyst', 'Statistics & Data Verification', 623, 98.20, 'active'),
      ('Ahmed Hassan', 'ahmed@factcheck.org', 'Fact-Checker', 'Immigration & Social Policy', 398, 95.80, 'active'),
      ('Jennifer Moore', 'jennifer@factcheck.org', 'Editor', 'Editorial Review & Quality', 2156, 99.50, 'active'),
      ('Thomas Brown', 'thomas@factcheck.org', 'Junior Fact-Checker', 'Entertainment & Celebrity', 187, 93.40, 'active'),
      ('Priya Sharma', 'priya@factcheck.org', 'Investigator', 'Deep Investigations', 345, 97.10, 'active'),
      ('Carlos Martinez', 'carlos@factcheck.org', 'Fact-Checker', 'Food & Agriculture', 412, 96.30, 'active'),
      ('Nicole Dubois', 'nicole@factcheck.org', 'Researcher', 'Academic & Scientific Claims', 567, 98.50, 'active')
    `);
    console.log('Team members seeded');

    // Seed Reports
    await client.query(`
      INSERT INTO reports (title, description, type, status, author, data) VALUES
      ('Weekly Misinformation Trends - March 2026', 'Comprehensive analysis of misinformation trends for the first week of March 2026', 'weekly', 'published', 'Sarah Chen', '{"claims_reviewed": 234, "debunked": 156, "verified": 45, "pending": 33}'),
      ('Health Misinformation Q1 2026 Report', 'Quarterly analysis of health-related misinformation patterns and impact', 'quarterly', 'published', 'Maria Santos', '{"total_health_claims": 890, "vaccine_related": 345, "cure_claims": 234, "diet_claims": 311}'),
      ('Election Integrity Special Report', 'In-depth investigation of election-related misinformation ahead of 2026 midterms', 'special', 'published', 'Marcus Johnson', '{"claims_tracked": 567, "foreign_origin": 123, "domestic_origin": 444}'),
      ('Social Media Platform Comparison', 'Comparative analysis of misinformation spread across major social platforms', 'analysis', 'published', 'Lisa Wang', '{"platforms_analyzed": 6, "highest_misinfo": "Facebook", "fastest_spread": "TikTok"}'),
      ('AI-Generated Content Detection', 'Report on the effectiveness of AI detection tools for synthetic media', 'technical', 'draft', 'Elena Rodriguez', '{"tools_tested": 8, "avg_accuracy": 87.3, "deepfake_detection": 92.1}'),
      ('Climate Misinformation Annual Review', 'Annual review of climate change misinformation campaigns and their sources', 'annual', 'published', 'David Kim', '{"campaigns_identified": 34, "total_reach": 45000000, "funding_traced": 12}'),
      ('Cryptocurrency Scam Alert Report', 'Emergency report on rising cryptocurrency investment scams', 'alert', 'published', 'James Wilson', '{"scams_identified": 89, "estimated_losses": 23000000, "platforms_affected": 15}'),
      ('Fact-Checker Performance Review Q1', 'Quarterly performance metrics for fact-checking team', 'internal', 'draft', 'Jennifer Moore', '{"team_size": 15, "avg_accuracy": 97.2, "claims_per_checker": 156}'),
      ('Immigration Misinformation Tracker', 'Monthly tracking report on immigration-related false claims', 'monthly', 'published', 'Ahmed Hassan', '{"claims_tracked": 203, "debunked": 178, "sources_identified": 45}'),
      ('Deepfake Technology Impact Assessment', 'Assessment of deepfake technology impact on information ecosystem', 'assessment', 'published', 'Priya Sharma', '{"deepfakes_detected": 234, "political": 89, "celebrity": 112, "other": 33}'),
      ('Public Health Emergency Report', 'Rapid response report on dangerous health misinformation', 'emergency', 'published', 'Sarah Chen', '{"dangerous_claims": 45, "hospitalizations_linked": 12, "platforms_notified": 8}'),
      ('Monthly Source Credibility Update', 'Monthly update on source credibility ratings and changes', 'monthly', 'published', 'Nicole Dubois', '{"sources_reviewed": 150, "upgraded": 12, "downgraded": 8, "new_sources": 23}'),
      ('Cross-Platform Viral Analysis', 'Analysis of how misinformation crosses platform boundaries', 'analysis', 'draft', 'Lisa Wang', '{"viral_chains": 67, "avg_platforms": 3.4, "avg_time_to_spread": "4.2 hours"}'),
      ('Education Misinformation Brief', 'Briefing document on education-related misinformation for policymakers', 'brief', 'published', 'Thomas Brown', '{"topics_covered": 12, "recommendations": 8, "stakeholders": 5}'),
      ('Annual Organizational Impact Report', 'Yearly report on organizational impact and achievements', 'annual', 'draft', 'Jennifer Moore', '{"claims_reviewed": 12456, "debunked": 8934, "partnerships": 45, "media_citations": 678}')
    `);
    console.log('Reports seeded');

    // Seed Alerts
    await client.query(`
      INSERT INTO alerts (title, description, severity, type, source, status, claim_id) VALUES
      ('Viral Vaccine Microchip Claim Resurging', 'The microchip vaccine claim has seen a 300% increase in shares over the past 24 hours', 'critical', 'viral_spike', 'Facebook', 'active', 1),
      ('Coordinated Bot Network Detected', 'Automated accounts spreading election fraud narratives across multiple platforms', 'critical', 'bot_network', 'Twitter/X', 'active', 2),
      ('Dangerous Health Advice Spreading', 'Bleach consumption advice gaining traction in health groups', 'critical', 'health_danger', 'WhatsApp', 'resolved', 16),
      ('New Deepfake Video of Political Figure', 'Sophisticated deepfake video of a senator making false statements detected', 'high', 'deepfake', 'YouTube', 'active', NULL),
      ('Bank Panic Posts Increasing', 'Social media posts about bank failures increasing, potential for bank run', 'high', 'financial_panic', 'Twitter/X', 'active', 6),
      ('Foreign Influence Operation Detected', 'State-sponsored accounts pushing disinformation about power grid vulnerability', 'critical', 'foreign_influence', 'Telegram', 'investigating', 17),
      ('Celebrity Death Hoax Round 2', 'Second wave of celebrity death hoax emerging from different source', 'medium', 'hoax', 'TikTok', 'monitoring', 9),
      ('Anti-GMO Campaign Launch', 'Coordinated campaign against GMO foods launching across platforms', 'medium', 'campaign', 'Multiple', 'active', NULL),
      ('Fake Government Document Circulating', 'Fabricated government document about homeschooling ban going viral', 'high', 'forgery', 'Facebook', 'resolved', 8),
      ('Crypto Pump-and-Dump Alert', 'Multiple coordinated cryptocurrency scam campaigns detected', 'high', 'financial_scam', 'Telegram', 'active', NULL),
      ('AI-Generated News Articles Found', 'Cluster of AI-generated fake news articles found on multiple sites', 'high', 'ai_generated', 'Web', 'investigating', NULL),
      ('Climate Data Manipulation Claims Spike', 'Renewed push of climate data fabrication narrative', 'medium', 'narrative_spike', 'Twitter/X', 'monitoring', 7),
      ('Immigration Statistics Misquoted', 'Official statistics being deliberately misquoted in viral posts', 'high', 'misquote', 'Facebook', 'active', 11),
      ('Phishing Campaign Using Fact-Check Brand', 'Phishing emails using our organizations branding detected', 'critical', 'security', 'Email', 'active', NULL),
      ('New Conspiracy Theory Emerging', 'Novel conspiracy theory gaining rapid traction combining multiple narratives', 'medium', 'emerging', 'Reddit', 'monitoring', NULL)
    `);
    console.log('Alerts seeded');

    // Seed some AI Analyses
    await client.query(`
      INSERT INTO ai_analyses (claim_id, analysis_type, input_text, result, model_used) VALUES
      (1, 'claim_analysis', 'COVID-19 vaccine contains microchips', '{"verdict": "Very Likely False", "confidence": 0.98, "reasoning": "This claim contradicts well-established vaccine science. Vaccine ingredients are publicly documented and independently verified. The physical size of trackable microchips makes injection through vaccine needles impossible with current technology.", "key_indicators": ["No scientific evidence", "Physically impossible with current tech", "Ingredients publicly verified"], "risk_level": "high", "recommended_action": "Immediate debunk with scientific evidence"}', 'anthropic/claude-haiku-4.5'),
      (2, 'claim_analysis', 'Election machines switched votes in swing states', '{"verdict": "False", "confidence": 0.97, "reasoning": "Multiple independent audits, hand recounts, and security assessments have confirmed the accuracy of voting machines in all swing states. CISA has confirmed no evidence of compromised systems.", "key_indicators": ["Contradicted by audits", "No technical evidence", "Confirmed by CISA"], "risk_level": "critical", "recommended_action": "Reference official audit results"}', 'anthropic/claude-haiku-4.5'),
      (5, 'claim_analysis', 'New superfood cures all types of cancer', '{"verdict": "Very Likely False", "confidence": 0.96, "reasoning": "No single food has been proven to cure all types of cancer. Cancer is a complex group of diseases requiring different treatments. The claim shows typical patterns of health misinformation.", "key_indicators": ["Too good to be true", "No peer-reviewed evidence", "Commercial motivation"], "risk_level": "high", "recommended_action": "Debunk with medical expert sources"}', 'anthropic/claude-haiku-4.5'),
      (1, 'sentiment_analysis', 'COVID-19 vaccine contains microchips for government surveillance', '{"sentiment": "Strongly Negative", "score": -0.89, "emotions": {"fear": 0.85, "anger": 0.72, "distrust": 0.91, "surprise": 0.34}, "manipulation_indicators": {"emotional_language": true, "fear_mongering": true, "authority_distrust": true}, "viral_potential": "Very High"}', 'anthropic/claude-haiku-4.5'),
      (6, 'source_credibility', 'Anonymous Twitter account claiming major bank bankruptcy', '{"credibility_score": 1.2, "factors": {"account_age": "2 months", "followers": 234, "verification": false, "posting_pattern": "suspicious", "previous_claims": "multiple debunked"}, "assessment": "Very Low Credibility - Anonymous account with history of false claims and suspicious posting pattern", "recommendation": "Do not amplify. Monitor for coordinated activity."}', 'anthropic/claude-haiku-4.5'),
      (3, 'claim_analysis', '5G towers cause cancer and COVID symptoms', '{"verdict": "False", "confidence": 0.99, "reasoning": "5G uses non-ionizing radiation at frequencies well within established safety limits. No causal mechanism exists. COVID-19 spread in areas without 5G coverage.", "key_indicators": ["Contradicts physics", "No epidemiological evidence", "Correlation not causation"], "risk_level": "high", "recommended_action": "Educational content about EMF safety"}', 'anthropic/claude-haiku-4.5'),
      (11, 'sentiment_analysis', 'Immigrants responsible for 80% of crime', '{"sentiment": "Strongly Negative", "score": -0.92, "emotions": {"fear": 0.78, "anger": 0.88, "distrust": 0.82, "disgust": 0.65}, "manipulation_indicators": {"false_statistics": true, "scapegoating": true, "dehumanization": true}, "viral_potential": "High"}', 'anthropic/claude-haiku-4.5'),
      (16, 'claim_analysis', 'Drinking bleach cures viral infections', '{"verdict": "Extremely Dangerous and False", "confidence": 1.0, "reasoning": "Ingesting bleach is life-threatening. Sodium hypochlorite causes severe chemical burns to the mouth, throat, and stomach. Multiple deaths and hospitalizations have resulted from this advice.", "key_indicators": ["Medically dangerous", "Contradicts all medical science", "Known to cause harm"], "risk_level": "critical", "recommended_action": "Emergency alert - report to platform safety teams immediately"}', 'anthropic/claude-haiku-4.5'),
      (12, 'claim_analysis', 'AI will replace all jobs within 2 years', '{"verdict": "Misleading", "confidence": 0.88, "reasoning": "While AI is rapidly advancing, complete job replacement within 2 years is not supported by any credible analysis. Job transformation is occurring but total replacement is decades away for most occupations.", "key_indicators": ["Sensationalist timeline", "Ignores job creation", "No expert consensus"], "risk_level": "medium", "recommended_action": "Context article with expert opinions"}', 'anthropic/claude-haiku-4.5'),
      (17, 'source_credibility', 'Telegram channel claiming power grid hack', '{"credibility_score": 2.1, "factors": {"channel_age": "6 months", "subscribers": 12000, "verification": false, "posting_pattern": "alarmist", "previous_claims": "mixed accuracy"}, "assessment": "Low Credibility - Unverified channel with alarmist posting pattern. Some claims previously debunked.", "recommendation": "Verify with official cybersecurity agencies before reporting."}', 'anthropic/claude-haiku-4.5'),
      (4, 'claim_analysis', 'Government hiding alien contact since 1947', '{"verdict": "Unsubstantiated", "confidence": 0.94, "reasoning": "Despite decades of investigation, no credible evidence of government concealment of alien contact has been verified. Official explanations for Roswell have been documented.", "key_indicators": ["No verifiable evidence", "Official explanations exist", "Relies on unverified testimony"], "risk_level": "low", "recommended_action": "Historical context article"}', 'anthropic/claude-haiku-4.5'),
      (14, 'claim_analysis', 'Organic food proven to extend lifespan by 20 years', '{"verdict": "False", "confidence": 0.95, "reasoning": "No scientific study has demonstrated a 20-year lifespan extension from organic food consumption. While organic food may have some benefits, the claimed effect size is extraordinary and unsupported.", "key_indicators": ["Extraordinary claim", "No supporting study exists", "Commercial motivation"], "risk_level": "medium", "recommended_action": "Debunk with nutrition science sources"}', 'anthropic/claude-haiku-4.5'),
      (15, 'claim_analysis', 'Supreme Court secretly overturned landmark ruling', '{"verdict": "False", "confidence": 0.99, "reasoning": "Supreme Court proceedings and decisions are public record. Secret sessions overturning rulings would violate constitutional requirements and established judicial procedure.", "key_indicators": ["Violates legal process", "Public records contradict", "No credible source"], "risk_level": "high", "recommended_action": "Cite official Supreme Court records"}', 'anthropic/claude-haiku-4.5'),
      (7, 'sentiment_analysis', 'Climate change data fabricated by scientists for funding', '{"sentiment": "Negative", "score": -0.75, "emotions": {"distrust": 0.88, "anger": 0.62, "contempt": 0.71, "fear": 0.35}, "manipulation_indicators": {"authority_distrust": true, "conspiracy_framing": true, "financial_motivation_claim": true}, "viral_potential": "High"}', 'anthropic/claude-haiku-4.5'),
      (9, 'claim_analysis', 'Celebrity death hoax', '{"verdict": "False - Hoax", "confidence": 0.99, "reasoning": "The celebrity in question has been verified alive through multiple independent sources. The hoax originated from fake news websites with fabricated content.", "key_indicators": ["Celebrity confirmed alive", "Fake source websites", "Common hoax pattern"], "risk_level": "medium", "recommended_action": "Quick debunk referencing verified sources"}', 'anthropic/claude-haiku-4.5')
    `);
    console.log('AI analyses seeded');

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Seeding error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
