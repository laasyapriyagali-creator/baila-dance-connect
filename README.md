# Baila: Dance Connect

Create a modern mobile app called "Baila".



The theme of this app is yellow and black.



The app helps people discover potential dates through dance videos instead of selfies, bios, or texting.



Core philosophy:



People express themselves through movement, energy, and dance.



Users get to know each other during real-life dates, not through online chatting.



No follower counts, likes, comments, stories, or social media features.



No messaging system before the date.



Navigation should contain only 3 bottom tabs:

1.Dance

Main screen of the app.



Shows one full-screen vertical dance video at a time.



Users swipe or tap to move to the next dancer.



Two action buttons:



Orange "Next" button to skip.



Green "Dance" button to express interest.



The experience should feel minimal, immersive, and focused on the dancer.



Users swipe or tap to move to the next dancer.

Dates

Displays pending date requests.

If two users choose each other, a match is created.



Both users have 24 hours to accept or decline the date.



After accepting, the date is recorded.



Users can view previous dates.



Users can request a second date after meeting.



Focus on real-life interactions rather than online conversations.



Profile

where dance videos are the user's primary identity.

Include a large section called "My Dance Videos".



Features:



Prominent "Upload Dance Video" button.



Users can upload multiple dance videos.



Display uploaded videos in a clean vertical grid or card layout.



Allow users to select one video as their "Main Dance Video".



Main Dance Video is the video shown to other users in the discovery feed.



Allow users to delete, replace, reorder, and preview videos.



Show upload progress and video duration.



Encourage authentic and casual dance videos rather than professional performances.



The upload section should be the most important element on the Profile screen, visually larger than profile photo and personal information.



Profile photo.



Dance videos.



Dance styles.



Basic information only.



Settings section.



Clean and minimal design.



Design style:



Mobile-first.



Elegant and playful.



Modern UI.



Large video-focused screens.



Minimal text.



Orange and green action buttons.



Emphasis on movement, energy, authenticity, and real-world connections.



The app should feel different from Tinder, Bumble, or social media platforms. It should feel like a dance-first experience where people decide based on energy rather than photos, bios, or endless texting.



BAILA - User Flow (MVP)



User Registration



User signs up using:



Google

Apple

Email

User creates profile:



Name

Age

City

Gender

Interested in:

Dance Partner

Friends

Dates

Open to all

User uploads:



Profile photo

Minimum 1 dance video (mandatory)

Maximum 5 dance videos

User selects dance styles:



Freestyle

Hip-hop

K-pop

Salsa

Classical

Other

Profile is now active.



Discovering People



User lands on the Dance tab.



A dance video plays full screen.



The user sees:



Dance video

Name

City

Dance style

Actions:



🟡 Next



Skip and see another dancer.

🟢 Dance With Me



Send interest request.

Request System



When User A clicks "Dance With Me":



User B receives a request.



User B can:



✅ Accept



❌ Decline



If declined:

Request disappears.



If accepted:

Connection is created.



Connection Created



Once both users agree:



They appear inside the Connections tab.



Users can now:



View each other's full profiles.

See all dance videos.

See common dance interests.

No messaging system in MVP.



Purpose:

Encourage real-world interaction rather than endless chatting.



Meeting



Users decide independently whether they want to meet.



The app's purpose is discovery through dance.



The app does not manage the date itself.



After Meeting



Inside Connections:



Users can select:



⭐ Dance Again



If both users select Dance Again:



Connection remains active.



If not:

Connection becomes inactive.



Navigation



Tab 1 - Dance



Purpose:

Discover new people through dance videos.



Contains:



Full screen videos

Next button

Dance With Me button

Tab 2 - Connections



Purpose:

Manage accepted connections.



Contains:



Pending requests

Accepted connections

Previous connections

Dance Again requests

Tab 3 - Profile



Contains:



Profile photo

Dance videos

Dance styles

Settings

Matching Logic



MVP Version:



No algorithmic matching.



Users select people themselves.



Future versions may recommend people based on:



Dance styles

Location

Music preferences

Activity level

But MVP should remain simple.



User chooses.

User sends request.

Other user decides.



Dance With Me Request Flow



When a user clicks the green "Dance With Me" button, a confirmation popup appears asking:



"Would you like to dance with this person?"



The user can either select:



Yes → A dance request is sent to the other person.

No → The popup closes and the user returns to the dance feed.

If the other person accepts the request, a connection is created and both users can view each other in the Connections section. The purpose of the request is not to collect likes or matches, but to express interest in dancing and connecting with another person.



Design Theme



BAILA should have a bold, energetic, and playful visual identity inspired by dance, movement, confidence, and fun.



The primary brand color is yellow, with black used as a supporting color for contrast.



The interface should feel bright and lively rather than dark. Yellow should dominate the experience through buttons, highlights, navigation elements, icons, and brand accents. Black should mainly be used for text, contrast, and visual depth.



The overall feel should be:



Energetic

Youthful

Playful

Confident

Modern

Community-focused

Avoid dark-mode-heavy designs where black dominates the screen. The app should feel warm, welcoming, and full of life, with yellow being the first color users associate with BAILA.



Think: movement, rhythm, dance, and human connection.



2 days ago

Redesign the BAILA onboarding screen with a clean, modern, minimal aesthetic.



Theme:



Yellow is the primary brand color.

Black is used for typography and contrast.

Bright, energetic, playful, and welcoming.

Minimalist design with lots of whitespace.

Premium mobile app feel.

Screen Layout:



Centered BAILA logo at the top.



App name below the logo:

Baila



Use elegant typography, not all caps. The brand should feel friendly, modern, and human.



Tagline:

Dance to connect

Small, clean, and centered beneath the logo.



Remove all bullet points, feature lists, cards, explanations, and marketing text.

The screen should feel simple and confident rather than trying to explain everything.



Primary Call-to-Action button:

Text:

Find Your Rhythm



Large rounded yellow button.



Strong visual emphasis.



Optional small text below the button:

"Discover people through dance."



Keep it subtle and secondary.



Design Goal:



The screen should immediately communicate movement, energy, curiosity, and human connection.



Avoid startup landing page aesthetics.



Avoid dating app aesthetics.



Avoid social media aesthetics.



The experience should feel like entering a dance community where connections begin through movement rather than profiles or texting.



Keywords:

Dance, rhythm, movement, connection, energy, authenticity, community, playful, modern, minimal.

I've already attached the logo, take a look at it.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/05cfd571-c098-4d8f-9ed4-def4c54dea6a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
