import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { PortfolioGallery } from '@/components/shared/PortfolioGallery';
import type { ModelProfile as ModelProfileType } from '@kailani/types';
import { MapPin, Scale, Ruler, Film, Tv, Monitor, ShoppingBag, GraduationCap, Link as LinkIcon, Award } from 'lucide-react';

interface Props {
  profile: ModelProfileType & { user?: { verified?: boolean } | null };
  hidePortfolio?: boolean;
}

function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.205);
}

export function ModelProfile({ profile, hidePortfolio }: Props) {
  const tv = profile.televisionCredits ?? [];
  const modeling = profile.modelingCredits ?? [];
  const film = profile.filmCredits ?? [];
  const commercial = profile.commercialCredits ?? [];
  const hasAnyCredits = tv.length + modeling.length + film.length + commercial.length > 0;

  const skills = profile.skills ?? [];
  const languages = profile.languages ?? [];
  const education = profile.education ?? [];

  const hasProfessional = Boolean(profile.unionStatus || profile.representation || profile.website);

  const hasAppearance = Boolean(
    profile.heightCm || profile.weightKg || profile.build ||
    profile.hairColor || profile.eyeColor || profile.skinTone
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-6 items-start">
        <div className="w-48 h-64 relative rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {profile.profileImage ? (
            <Image src={profile.profileImage} alt={profile.displayName} fill sizes="192px" className="object-cover" />
          ) : profile.coverImage ? (
            <Image src={profile.coverImage} alt={profile.displayName} fill sizes="192px" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-muted-foreground">
              {profile.displayName[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            {profile.user?.verified && <VerifiedBadge size="md" />}
            {profile.gender && (
              <Badge variant="outline" className="text-xs">{profile.gender}</Badge>
            )}
          </div>
          {profile.location && (
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <MapPin size={13} /> {profile.location}
            </p>
          )}
          {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}
          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {profile.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}
          {profile.instagramUrl && (
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary mt-2 block hover:underline"
            >
              Instagram
            </a>
          )}
        </div>
      </div>

      <Separator />

      {/* Appearance */}
      {hasAppearance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler size={16} /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {profile.heightCm && (
                <Stat label="Height" value={`${profile.heightCm} cm (${cmToFeetInches(profile.heightCm)})`} />
              )}
              {profile.weightKg && (
                <Stat label="Weight" value={`${profile.weightKg} kg (${kgToLbs(profile.weightKg)} lbs)`} />
              )}
              {profile.build && <Stat label="Build" value={profile.build} />}
              {profile.hairColor && <Stat label="Hair" value={profile.hairColor} />}
              {profile.eyeColor && <Stat label="Eyes" value={profile.eyeColor} />}
              {profile.skinTone && <Stat label="Skin Tone" value={profile.skinTone} />}
            </dl>
            {profile.playingAgeMin && profile.playingAgeMax && (
              <div className="mt-4">
                <Badge variant="outline" className="text-xs">
                  Playing Age: {profile.playingAgeMin}–{profile.playingAgeMax}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Measurements */}
      {(profile.bustCm || profile.waistCm || profile.hipsCm || profile.shoeSize) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale size={16} /> Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {profile.bustCm && <Stat label="Bust" value={`${profile.bustCm} cm`} />}
              {profile.waistCm && <Stat label="Waist" value={`${profile.waistCm} cm`} />}
              {profile.hipsCm && <Stat label="Hips" value={`${profile.hipsCm} cm`} />}
              {profile.shoeSize && <Stat label="Shoe" value={String(profile.shoeSize)} />}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Credits */}
      {hasAnyCredits && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Film size={16} /> Credits & Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {tv.length > 0 && (
              <CreditSection
                icon={<Tv size={14} />}
                label="Television"
                entries={tv.map((c) => ({
                  date: c.date,
                  title: c.title,
                  role: c.role,
                  extra: [c.production, c.director ? `Dir. ${c.director}` : '', c.location].filter(Boolean).join(' · '),
                }))}
              />
            )}
            {film.length > 0 && (
              <CreditSection
                icon={<Film size={14} />}
                label="Film"
                entries={film.map((c) => ({
                  date: c.date,
                  title: c.title,
                  role: c.role,
                  extra: [c.production, c.director ? `Dir. ${c.director}` : '', c.location].filter(Boolean).join(' · '),
                }))}
              />
            )}
            {modeling.length > 0 && (
              <CreditSection
                icon={<Monitor size={14} />}
                label="Modeling"
                entries={modeling.map((c) => ({
                  date: c.date,
                  title: c.title,
                  role: c.role,
                  extra: [c.client, c.photographer ? `Photo: ${c.photographer}` : '', c.location].filter(Boolean).join(' · '),
                }))}
              />
            )}
            {commercial.length > 0 && (
              <CreditSection
                icon={<ShoppingBag size={14} />}
                label="Commercial"
                entries={commercial.map((c) => ({
                  date: c.date,
                  title: c.title,
                  role: c.role,
                  extra: [c.client, c.location].filter(Boolean).join(' · '),
                }))}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills & Languages */}
      {(skills.length > 0 || languages.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award size={16} /> Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <span key={l} className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Professional */}
      {hasProfessional && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon size={16} /> Professional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {profile.unionStatus && <Stat label="Union Status" value={profile.unionStatus} />}
              {profile.representation && <Stat label="Representation" value={profile.representation} />}
              {profile.website && (
                <div>
                  <dt className="text-muted-foreground">Website</dt>
                  <dd className="font-medium">
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {profile.website}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap size={16} /> Education & Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {education.map((e, i) => (
                <li key={i} className="flex gap-3 items-baseline">
                  <span className="text-muted-foreground text-xs w-14 flex-shrink-0">{e.year || '—'}</span>
                  <div className="min-w-0">
                    <span className="font-medium">{e.institution}</span>
                    {e.degree && <span className="text-muted-foreground"> — {e.degree}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Portfolio — only shown when not extracted to a side panel */}
      {!hidePortfolio && profile.portfolioImages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Portfolio</h2>
          <PortfolioGallery
            images={profile.portfolioImages}
            coverImage={profile.coverImage}
            profileName={profile.displayName}
            profileLocation={profile.location}
            tags={profile.tags}
            updateUrl
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function CreditSection({ icon, label, entries }: {
  icon: React.ReactNode;
  label: string;
  entries: Array<{ date?: string; title: string; role?: string; extra?: string }>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
        <span>{icon}</span> {label}
      </p>
      <ul className="space-y-2">
        {entries.map((e, i) => (
          <li key={i} className="flex gap-3 items-baseline text-sm">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{e.date || '—'}</span>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold">{e.title}</span>
                {e.role && <span className="text-xs text-muted-foreground">{e.role}</span>}
              </div>
              {e.extra && <p className="text-xs text-muted-foreground">{e.extra}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
