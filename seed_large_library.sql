-- Seeding Large Public Domain Classic Literature Library

-- Clear existing defaults if needed (optional, uncomment if you want a clean slate)
-- DELETE FROM texts WHERE id IN ('d04d808e-17cb-4b71-b0db-6a75f142ebdb', 'f58c7068-1985-45a8-b643-df9b4bc04ed6');

INSERT INTO texts (title, author, content, difficulty) VALUES 
('Pride and Prejudice', 'Jane Austen', 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', 'Medium'),
('Frankenstein', 'Mary Shelley', 'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.', 'Hard'),
('Moby-Dick', 'Herman Melville', 'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.', 'Hard'),
('1984', 'George Orwell', 'It was a bright cold day in April, and the clocks were striking thirteen.', 'Medium'),
('A Tale of Two Cities', 'Charles Dickens', 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness...', 'Hard'),
('The Great Gatsby', 'F. Scott Fitzgerald', 'In my younger and more vulnerable years my father gave me some advice that I''ve been turning over in my mind ever since.', 'Medium'),
('Alice''s Adventures in Wonderland', 'Lewis Carroll', 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it...', 'Easy'),
('Jane Eyre', 'Charlotte Brontë', 'There was no possibility of taking a walk that day.', 'Medium'),
('The Picture of Dorian Gray', 'Oscar Wilde', 'The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.', 'Hard'),
('Dracula', 'Bram Stoker', '3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late.', 'Medium'),
('Wuthering Heights', 'Emily Brontë', '1801.—I have just returned from a visit to my landlord—the solitary neighbour that I shall be troubled with.', 'Hard'),
('The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', 'To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name.', 'Medium'),
('The Odyssey', 'Homer', 'Tell me, O muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy.', 'Hard'),
('Crime and Punishment', 'Fyodor Dostoevsky', 'On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.', 'Hard'),
('The Metamorphosis', 'Franz Kafka', 'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.', 'Medium'),
('Heart of Darkness', 'Joseph Conrad', 'The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest.', 'Hard'),
('The Scarlet Letter', 'Nathaniel Hawthorne', 'A throng of bearded men, in sad-colored garments and gray, steeple-crowned hats, intermixed with women, some wearing hoods, and others bareheaded, was assembled in front of a wooden edifice, the door of which was heavily timbered with oak, and studded with iron spikes.', 'Hard'),
('Don Quixote', 'Miguel de Cervantes', 'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.', 'Hard'),
('The Count of Monte Cristo', 'Alexandre Dumas', 'On the 24th of February, 1815, the look-out at Notre-Dame de la Garde signalled the three-master, the Pharaon from Smyrna, Trieste, and Naples.', 'Medium'),
('Les Misérables', 'Victor Hugo', 'In 1815, M. Charles-François-Bienvenu Myriel was Bishop of D—. He was an old man of about seventy-five years of age; he had occupied the see of D— since 1806.', 'Hard'),
('Anna Karenina', 'Leo Tolstoy', 'Happy families are all alike; every unhappy family is unhappy in its own way.', 'Hard'),
('The Brothers Karamazov', 'Fyodor Dostoevsky', 'Alexey Fyodorovitch Karamazov was the third son of Fyodor Pavlovitch Karamazov, a land owner well known in our district in his own day, and still remembered among us owing to his gloomy and tragic death...', 'Hard'),
('The Importance of Being Earnest', 'Oscar Wilde', 'Algernon: Did you hear what I was playing, Lane? Lane: I didn’t think it polite to listen, sir.', 'Medium'),
('Great Expectations', 'Charles Dickens', 'My father''s family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip.', 'Medium'),
('The Adventures of Huckleberry Finn', 'Mark Twain', 'You don''t know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain''t no matter.', 'Medium')
ON CONFLICT DO NOTHING;

-- Seed Vocabulary Bank (10 literary terms) for the first user it finds (or just insert them if user runs it)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        INSERT INTO vocabulary (user_id, term, definition, translation, source_text, context, notes) VALUES
        (first_user_id, 'Melancholy', 'A feeling of pensive sadness, typically with no obvious cause.', 'Melankolia / Kesedihan mendalam', 'General', 'He was consumed by a deep melancholy.', 'Sering dipakai di era Romantis'),
        (first_user_id, 'Ethereal', 'Extremely delicate and light in a way that seems too perfect for this world.', 'Sangat halus / Surgawi', 'General', 'Her ethereal beauty captivated everyone.', 'Gunakan untuk mendeskripsikan hal-hal gaib atau sangat suci'),
        (first_user_id, 'Ephemeral', 'Lasting for a very short time.', 'Fana / Singkat', 'General', 'The ephemeral nature of youth.', 'Cocok dipadankan dengan kata "fana" dalam sastra Indonesia'),
        (first_user_id, 'Labyrinthine', 'Like a labyrinth; irregular and twisting.', 'Berliku-liku / Rumit bagai labirin', 'General', 'The labyrinthine streets of the old city.', 'Sering dipakai dalam genre Gothic'),
        (first_user_id, 'Resplendent', 'Attractive and impressive through being richly colorful or sumptuous.', 'Gemilang / Berseri-seri', 'General', 'She looked resplendent in her green dress.', 'Berkaitan dengan kemegahan visual'),
        (first_user_id, 'Ineffable', 'Too great or extreme to be expressed or described in words.', 'Tak terlukiskan', 'General', 'The ineffable beauty of the sunset.', 'Banyak dipakai untuk pengalaman spiritual'),
        (first_user_id, 'Petrichor', 'A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather.', 'Aroma hujan pertama', 'General', 'The air was filled with petrichor.', 'Kata benda, tidak butuh diterjemahkan secara harfiah kadang-kadang'),
        (first_user_id, 'Serendipity', 'The occurrence and development of events by chance in a happy or beneficial way.', 'Kebetulan yang menguntungkan', 'General', 'A stroke of serendipity led him to her.', 'Sulit dicari padanan 1 kata di bahasa Indonesia'),
        (first_user_id, 'Solitude', 'The state or situation of being alone.', 'Kesunyian / Kesendirian', 'General', 'He enjoyed the peace and solitude of the woods.', 'Berbeda dengan "loneliness" (kesepian) yang berkonotasi negatif'),
        (first_user_id, 'Lugubrious', 'Looking or sounding sad and dismal.', 'Muram / Menyedihkan', 'General', 'His face looked even more lugubrious than usual.', 'Lebih sering merujuk pada ekspresi atau suara')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
