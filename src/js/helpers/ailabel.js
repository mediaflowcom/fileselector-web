import { getDamInfoTranslation } from '../services/translations';

export const aiLabelIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
  <path d="M3.58,13.02h-1.88L4.85,3.43h2.17l3.13,9.58h-1.98l-.73-2.47h-3.13l-.73,2.47h0ZM5.93,5.27h-.08l-1.15,3.88h2.38l-1.15-3.88ZM11.86,13.02V3.43h1.84v9.58h-1.84Z"/>
</svg>`;

export const AiContentStatus = {
  NO_AI_CONTENT: 'NO_AI_CONTENT',
  CREATED_BY_AI: 'CREATED_BY_AI',
  MODIFIED_BY_AI: 'MODIFIED_BY_AI'
};

const descriptionMaxLength = 192;

export function hasAiLabel(file) {
  const status = file?.aiContent?.status;
  return status === AiContentStatus.CREATED_BY_AI || status === AiContentStatus.MODIFIED_BY_AI;
}

export function getAiLabelTitle() {
  return getDamInfoTranslation('aiLabel');
}

export function getAiLabelHeading(file) {
  if (file?.aiContent?.status === AiContentStatus.CREATED_BY_AI) {
    return getDamInfoTranslation('aiLabelCreated');
  }
  return getDamInfoTranslation('aiLabelModified');
}

export function getAiLabelDescription(file) {
  const description = file?.aiContent?.description ?? '';
  if (description.length <= descriptionMaxLength) {
    return description;
  }
  return description.substring(0, descriptionMaxLength - 3) + '...';
}

export function getAiLabelTooltip(file) {
  const heading = getAiLabelHeading(file);
  const description = getAiLabelDescription(file);
  return description ? heading + '\n' + description : heading;
}
