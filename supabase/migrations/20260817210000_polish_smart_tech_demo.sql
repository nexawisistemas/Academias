update public.membership_plans p
set
  name = 'Plano Performance',
  description = 'Musculação, aulas de jump e acompanhamento para evoluir com constância.',
  benefits = '["Musculação completa", "Aulas de jump", "Orientação no treino", "Acompanhamento da evolução"]'::jsonb,
  updated_at = now()
from public.organizations o
where p.organization_id = o.id
  and o.slug = 'smart-tech'
  and p.name = 'Frango';
