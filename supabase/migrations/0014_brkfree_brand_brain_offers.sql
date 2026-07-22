-- Separate Offers from Services / products in BrkFree Brand Brain.

alter table public.brkfree_brand_brains
  add column if not exists offers text;
