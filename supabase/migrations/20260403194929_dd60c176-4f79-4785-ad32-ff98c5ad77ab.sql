
UPDATE enrollments SET summercamp_start_date = '2027-01-01' WHERE id = '07c8ce80-8513-42b4-8807-b62feb70c78e';

INSERT INTO installments (enrollment_id, type, installment_number, due_date, status, amount_cents)
VALUES
  ('07c8ce80-8513-42b4-8807-b62feb70c78e', 'summercamp', 1, '2027-01-01', 'pending', 66667),
  ('07c8ce80-8513-42b4-8807-b62feb70c78e', 'summercamp', 2, '2027-02-01', 'pending', 66667),
  ('07c8ce80-8513-42b4-8807-b62feb70c78e', 'summercamp', 3, '2027-03-01', 'pending', 66667),
  ('07c8ce80-8513-42b4-8807-b62feb70c78e', 'summercamp', 4, '2027-04-01', 'pending', 66667),
  ('07c8ce80-8513-42b4-8807-b62feb70c78e', 'summercamp', 5, '2027-05-01', 'pending', 66667),
  ('07c8ce80-8513-42b4-8807-b62feb70c78e', 'summercamp', 6, '2027-06-01', 'pending', 66667);
