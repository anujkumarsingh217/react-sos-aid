DELETE FROM public.hospital_acknowledgements;
DELETE FROM public.hospitals;

INSERT INTO public.hospitals (name, contact_info, is_connected, location)
VALUES
  ('Apollo Bhilai Hospital, Dhanora Rd', '+91 788 263 1300', true, ST_GeogFromText('SRID=4326;POINT(81.3540 21.1910)')),
  ('Jawaharlal Nehru Hospital, Sector 9', '+91 788 222 2701', true, ST_GeogFromText('SRID=4326;POINT(81.3455 21.2072)')),
  ('Bhilai Steel Plant Hospital, Sector 1', '+91 788 222 3456', true, ST_GeogFromText('SRID=4326;POINT(81.3680 21.2140)')),
  ('ESI Hospital, Sector 7', '+91 788 222 1290', true, ST_GeogFromText('SRID=4326;POINT(81.3410 21.1945)')),
  ('Krishna Multispeciality Hospital, Civic Centre', '+91 788 298 5400', false, ST_GeogFromText('SRID=4326;POINT(81.3500 21.1830)'));