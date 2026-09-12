import type { Book } from '../types';

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'sample-time-machine',
    title: 'The Time Machine',
    author: 'H.G. Wells',
    description: 'An inventor known simply as the Time Traveller journeys into the year A.D. 802,701, where humanity has diverged into the gentle Eloi and the underground Morlocks.',
    category: 'Science Fiction',
    format: 'epub',
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    totalWords: 32400,
    coverGradient: 'from-amber-700 via-orange-800 to-stone-900',
    readingProgress: {
      currentChapterIndex: 0,
      currentPageIndex: 0,
      percentage: 12,
      lastReadTimestamp: Date.now() - 1000 * 60 * 30,
    },
    chapters: [
      {
        id: 'tm-ch1',
        title: 'Chapter I — The Fourth Dimension',
        wordCount: 2200,
        content: `The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burned brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.

Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision. And he put it to us in this way—marking the points with a lean forefinger—as we sat and lazily admired his earnestness over this new paradox (as we thought it) and his fecundity.

"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception."

"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.

"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions."

"That is all right," said the Psychologist.

"Nor, having only length, breadth, and thickness, can a cube have a real existence."

"There I object," said Filby. "Of course a solid body may exist. All real things—"

"So most people think. But wait a moment. Can an instantaneous cube exist?"

"Don't follow you," said Filby.

"Can a cube that does not last for any time at all, have a real existence?"

Filby became pensive. "Clearly," the Time Traveller proceeded, "any real body must have extension in four directions: it must have Length, Breadth, Thickness, and—Duration. But through a natural infirmity of the flesh, which I will explain to you in a moment, we incline to overlook this fact. There are really four dimensions, three which we call the three planes of Space, and a fourth, Time. There is, however, a tendency to draw an unreal distinction between the former three dimensions and the latter, because it happens that our consciousness moves intermittently along the latter from the beginning to the end of our lives."

"That," said a very young man, making spasmodic efforts to relight his cigar over the lamp; "that . . . very clear indeed."

"Now, it is very remarkable that this is so extensively overlooked," continued the Time Traveller, with a slight accession of cheerfulness. "Really this is what is meant by the Fourth Dimension, though some people who talk about the Fourth Dimension do not know they mean it. It is only another way of looking at Time. There is no difference between Time and any of the three dimensions of Space except that our consciousness moves along it."`,
      },
      {
        id: 'tm-ch2',
        title: 'Chapter II — The Golden Age',
        wordCount: 2600,
        content: `In another moment we were in the laboratory again, looking at the miniature machine that the Time Traveller had constructed. It looked like an exquisite clockwork ornament of ivory and transparent crystal, resting upon an ebony table.

"Look closely," he said, holding a lamp above it. "This little device took two years of rigorous mathematical calculation. Here is a bar that sends it hurtling into the future, and this counter-bar reverses the journey. Watch the lever."

He pressed the tiny lever. A sudden puff of wind seemed to eddy through the room, whistling faintly around our ears. The lamp flame flickered violently, and for an instant the machine swayed, grew indistinct, seemed like a ghost for a fraction of a second, and was gone!

Filby gasped. The Medical Man leaned forward, peering through his spectacles. "Where has it gone?"

"Into the future," said the Time Traveller serenely. "It is travelling through time, following the coordinate stream of London at an accelerated pace. To you and me, it simply vanished; to it, our room is flashing through decades."

"And the full-sized machine?" I inquired, gazing at the far corner where a large, skeletal framework of nickel, brass, and quartz stood beside the heavy workbenches.

"It is finished," he replied quietly. "Tomorrow morning at dawn, I embark upon the grand experiment. I shall see what humanity becomes when the struggle for existence has at last been won."`,
      },
      {
        id: 'tm-ch3',
        title: 'Chapter III — The Year 802,701',
        wordCount: 3100,
        content: `The sensation of time travel is singularly unpleasant. It produces a kind of headlong, chaotic nausea, accompanied by a horrible anticipation of imminent disaster. As I pressed the forward lever, the laboratory grew faint and hazy. Night followed day like the flapping of a black wing.

The sun became a dazzling streak of golden fire across the sky; the moon spun through its phases like a swift revolving lantern. I saw colossal architectural structures rise like dreams and vanish into dust. Trees sprang up, burst into scarlet and emerald foliage, and dissolved like vapor.

At last, I pulled the reverse lever with abrupt force.

A terrible shock flung me from my saddle. I rolled across a carpet of soft, damp rhododendron blossoms, dazed and drenched by a thunderstorm that rolled across a transformed landscape. When I struggled to my feet, I looked upon a gigantic white sphinx carved from marble, weathered by centuries of rain, towering over a verdant valley filled with strange, circular palaces.

From the surrounding groves emerged the inhabitants of this distant era: delicate, graceful beings clothed in soft tunics of woven silk, adorned with garlands of brilliant blossoms. Their hair was curly and lustrous, their skin possessed the luminous fragility of porcelain, and their voices resonated with the musical timbre of birds.

They ran towards me with delighted laughter, unburdened by fear, presenting wreaths of flowers. I had anticipated towering supermen of transcendent intellect; instead, I found a gentle, carefree race living in perpetual leisure, bathed in perpetual sunlight, untouched by sorrow or toil. But beneath their idyllic existence lay a silence—and an unspoken dread of the falling dark.`,
      },
    ],
  },
  {
    id: 'sample-art-of-war',
    title: 'The Art of War',
    author: 'Sun Tzu',
    description: 'An ancient Chinese military treatise attributed to Sun Tzu, a high-ranking military general, strategist, and tactician. Consists of 13 chapters devoted to the strategic elements of conflict and philosophy.',
    category: 'Philosophy & Strategy',
    format: 'txt',
    addedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    totalWords: 15800,
    coverGradient: 'from-emerald-800 via-teal-900 to-slate-950',
    readingProgress: {
      currentChapterIndex: 0,
      currentPageIndex: 0,
      percentage: 25,
      lastReadTimestamp: Date.now() - 1000 * 60 * 60 * 4,
    },
    chapters: [
      {
        id: 'aow-ch1',
        title: 'I. Laying Plans (Estimates)',
        wordCount: 1400,
        content: `Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.

The art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field.

These are: (1) The Moral Law; (2) Heaven; (3) Earth; (4) The Commander; (5) Method and discipline.

The Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.

Heaven signifies night and day, cold and heat, times and the seasons.

Earth comprises distances, great and small; danger and security; open ground and narrow passes; the chances of life and death.

The Commander stands for the virtues of wisdom, sincerity, benevolence, courage and strictness.

By Method and discipline are to be understood the marshaling of the army in its proper subdivisions, the graduations of rank among the officers, the maintenance of roads by which supplies may reach the army, and the control of military expenditure.

These five heads should be familiar to every general: he who knows them will be victorious; he who knows them not will fail.

Therefore, in your deliberations, when seeking to determine the military conditions, let them be made the basis of a comparison, in this wise:
(1) Which of the two sovereigns is imbued with the Moral law?
(2) Which of the two generals has most ability?
(3) With whom lie the advantages derived from Heaven and Earth?
(4) On which side is discipline most rigorously enforced?
(5) Which army is stronger?
(6) On which side are officers and men more highly trained?
(7) In which army is there the greater constancy both in reward and punishment?

By means of these seven considerations I can forecast victory or defeat.`,
      },
      {
        id: 'aow-ch2',
        title: 'II. Waging War',
        wordCount: 1600,
        content: `Sun Tzu said: In the operations of war, where there are in the field a thousand swift chariots, as many heavy chariots, and a hundred thousand mail-clad soldiers, with provisions enough to carry them a thousand li, the expenditure at home and at the front, including entertainment of guests, small items such as glue and paint, and sums spent on chariots and armor, will reach the total of a thousand ounces of silver per day. Such is the cost of raising an army of 100,000 men.

When you engage in actual fighting, if victory is long in coming, then men's weapons will grow dull and their ardor will be damped. If you lay siege to a town, you will exhaust your strength.

Again, if the campaign is protracted, the resources of the State will not be equal to the strain.

Now, when your weapons are dulled, your ardor damped, your strength exhausted and your treasure spent, other chieftains will spring up to take advantage of your extremity. Then no man, however wise, will be able to avert the consequences that must ensue.

Thus, though we have heard of stupid haste in war, cleverness has never been seen associated with long delays.

There is no instance of a country having benefited from prolonged warfare.

It is only one who is thoroughly acquainted with the evils of war that can thoroughly understand the profitable way of carrying it on.`,
      },
      {
        id: 'aow-ch3',
        title: 'III. Attack by Stratagem',
        wordCount: 1750,
        content: `Sun Tzu said: In the practical art of war, the best thing of all is to take the enemy's country whole and intact; to shatter and destroy it is not so good. So, too, it is better to recapture an army entire than to destroy it, to capture a regiment, a detachment or a company entire than to destroy them.

Hence to fight and conquer in all your battles is not supreme excellence; supreme excellence consists in breaking the enemy's resistance without fighting.

Thus the highest form of generalship is to balk the enemy's plans; the next best is to prevent the junction of the enemy's forces; the next in order is to attack the enemy's army in the field; and the worst policy of all is to besiege walled cities.

The rule is, not to besiege walled cities if it can possibly be avoided. The preparation of mantlets, movable shelters, and various engines of war, will take up three full months; and the piling up of mounds over against the walls will take three months more.

The general, unable to control his irritation, will launch his men to the assault like swarming ants, with the result that one-third of his men are slain, while the town still remains untaken. Such are the disastrous effects of a siege.

Therefore the skillful leader subdues the enemy's troops without any fighting; he captures their cities without laying siege to them; he overthrows their kingdom without lengthy operations in the field.

With his forces intact he will dispute the mastery of the Empire, and thus, without losing a man, his triumph will be complete. This is the method of attacking by stratagem.

If you know the enemy and know yourself, you need not fear the result of a hundred battles. If you know yourself but not the enemy, for every victory gained you will also suffer a defeat. If you know neither the enemy nor yourself, you will succumb in every battle.`,
      },
    ],
  },
];
