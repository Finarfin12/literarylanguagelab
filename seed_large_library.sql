-- Menghapus semua teks lama agar ditimpa dengan yang baru
DELETE FROM texts;

-- Memasukkan 25 Buku Karya Sastra Klasik
-- NOTE: difficulty must be 'beginner', 'intermediate', or 'advanced' (DB constraint)
INSERT INTO texts (title, author, content, difficulty, is_public, era, genre) VALUES 
('Pride and Prejudice', 'Jane Austen', 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', 'intermediate', true, 'Victorian', 'Novel'),
('Frankenstein', 'Mary Shelley', 'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.', 'advanced', true, 'Romantic', 'Novel'),
('Moby-Dick', 'Herman Melville', 'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.', 'advanced', true, 'Romantic', 'Novel'),
('1984', 'George Orwell', 'It was a bright cold day in April, and the clocks were striking thirteen.', 'intermediate', true, 'Modern', 'Novel'),
('A Tale of Two Cities', 'Charles Dickens', 'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness...', 'advanced', true, 'Victorian', 'Novel'),
('The Great Gatsby', 'F. Scott Fitzgerald', 'In my younger and more vulnerable years my father gave me some advice that I have been turning over in my mind ever since.', 'intermediate', true, 'Modern', 'Novel'),
('Alice''s Adventures in Wonderland', 'Lewis Carroll', 'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it...', 'beginner', true, 'Victorian', 'Novel'),
('Jane Eyre', 'Charlotte Brontë', 'There was no possibility of taking a walk that day.', 'intermediate', true, 'Victorian', 'Novel'),
('The Picture of Dorian Gray', 'Oscar Wilde', 'The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.', 'advanced', true, 'Victorian', 'Novel'),
('Dracula', 'Bram Stoker', '3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late.', 'intermediate', true, 'Victorian', 'Novel'),
('Wuthering Heights', 'Emily Brontë', '1801.—I have just returned from a visit to my landlord—the solitary neighbour that I shall be troubled with.', 'advanced', true, 'Victorian', 'Novel'),
('The Adventures of Sherlock Holmes', 'Arthur Conan Doyle', 'To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name.', 'intermediate', true, 'Victorian', 'Short Story'),
('The Odyssey', 'Homer', 'Tell me, O muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy.', 'advanced', true, 'Classical', 'Poetry'),
('Crime and Punishment', 'Fyodor Dostoevsky', 'On an exceptionally hot evening early in July a young man came out of the garret in which he lodged in S. Place and walked slowly, as though in hesitation, towards K. bridge.', 'advanced', true, 'Modern', 'Novel'),
('The Metamorphosis', 'Franz Kafka', 'One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin.', 'intermediate', true, 'Modern', 'Novel'),
('Heart of Darkness', 'Joseph Conrad', 'The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest.', 'advanced', true, 'Modern', 'Novel'),
('The Scarlet Letter', 'Nathaniel Hawthorne', 'A throng of bearded men, in sad-colored garments and gray, steeple-crowned hats, intermixed with women, some wearing hoods, and others bareheaded, was assembled in front of a wooden edifice, the door of which was heavily timbered with oak, and studded with iron spikes.', 'advanced', true, 'Romantic', 'Novel'),
('Don Quixote', 'Miguel de Cervantes', 'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.', 'advanced', true, 'Renaissance', 'Novel'),
('The Count of Monte Cristo', 'Alexandre Dumas', 'On the 24th of February, 1815, the look-out at Notre-Dame de la Garde signalled the three-master, the Pharaon from Smyrna, Trieste, and Naples.', 'intermediate', true, 'Romantic', 'Novel'),
('Les Misérables', 'Victor Hugo', 'In 1815, M. Charles-François-Bienvenu Myriel was Bishop of D—. He was an old man of about seventy-five years of age; he had occupied the see of D— since 1806.', 'advanced', true, 'Romantic', 'Novel'),
('Anna Karenina', 'Leo Tolstoy', 'Happy families are all alike; every unhappy family is unhappy in its own way.', 'advanced', true, 'Modern', 'Novel'),
('The Brothers Karamazov', 'Fyodor Dostoevsky', 'Alexey Fyodorovitch Karamazov was the third son of Fyodor Pavlovitch Karamazov, a land owner well known in our district in his own day, and still remembered among us owing to his gloomy and tragic death...', 'advanced', true, 'Modern', 'Novel'),
('The Importance of Being Earnest', 'Oscar Wilde', 'Algernon: Did you hear what I was playing, Lane? Lane: I did not think it polite to listen, sir.', 'intermediate', true, 'Victorian', 'Drama'),
('Great Expectations', 'Charles Dickens', 'My father''s family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer or more explicit than Pip.', 'intermediate', true, 'Victorian', 'Novel'),
('The Adventures of Huckleberry Finn', 'Mark Twain', 'You do not know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that is no matter.', 'intermediate', true, 'Modern', 'Novel');


-- Memasukkan 10 Vocab Bank (Ini butuh user_id karena vocab bersifat privat per user)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        DELETE FROM vocabulary WHERE user_id = first_user_id;

        INSERT INTO vocabulary (user_id, word, definition, context_sentence, register, notes) VALUES
        (first_user_id, 'Melancholy', 'A feeling of pensive sadness.', 'He was consumed by a deep melancholy.', 'General', 'Sering dipakai di era Romantis'),
        (first_user_id, 'Ethereal', 'Extremely delicate and light.', 'Her ethereal beauty captivated everyone.', 'General', 'Gunakan untuk mendeskripsikan hal-hal gaib atau sangat suci'),
        (first_user_id, 'Ephemeral', 'Lasting for a very short time.', 'The ephemeral nature of youth.', 'General', 'Cocok dipadankan dengan kata "fana"'),
        (first_user_id, 'Labyrinthine', 'Irregular and twisting.', 'The labyrinthine streets of the old city.', 'General', 'Sering dipakai dalam genre Gothic'),
        (first_user_id, 'Resplendent', 'Attractive and impressive.', 'She looked resplendent in her green dress.', 'General', 'Berkaitan dengan kemegahan visual'),
        (first_user_id, 'Ineffable', 'Too great to be expressed.', 'The ineffable beauty of the sunset.', 'General', 'Banyak dipakai untuk pengalaman spiritual'),
        (first_user_id, 'Petrichor', 'A pleasant smell after the first rain.', 'The air was filled with petrichor.', 'General', 'Kata benda khusus'),
        (first_user_id, 'Serendipity', 'The occurrence of events by chance in a happy way.', 'A stroke of serendipity led him to her.', 'General', 'Kebetulan yang menguntungkan'),
        (first_user_id, 'Solitude', 'The state of being alone.', 'He enjoyed the peace and solitude.', 'General', 'Berbeda dengan kesepian'),
        (first_user_id, 'Lugubrious', 'Looking or sounding sad.', 'His face looked lugubrious.', 'General', 'Lebih sering merujuk pada ekspresi')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
