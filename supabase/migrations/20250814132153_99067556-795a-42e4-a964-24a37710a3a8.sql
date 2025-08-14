-- Add new columns to panchayath_notes table for agent support and categorization
ALTER TABLE public.panchayath_notes 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id),
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'panchayath';

-- Update existing notes to have default category
UPDATE public.panchayath_notes 
SET category = 'panchayath' 
WHERE category IS NULL;