import styled, { css } from 'styled-components'

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: #07071a;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const BackgroundOverlay = styled.div`
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(88, 28, 220, 0.25) 0%, transparent 55%),
    radial-gradient(ellipse at 80% 70%, rgba(14, 116, 144, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(7, 7, 26, 0.9) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
`

export const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  position: relative;
  z-index: 10;

  @media (max-width: 640px) {
    padding: 16px 20px;
  }
`

export const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`

export const LogoIcon = styled.span`
  font-size: 22px;
  color: #a78bfa;
`

export const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
`

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 28px;

  a {
    color: #c4b5fd;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #ffffff;
    }
  }

  @media (max-width: 640px) {
    gap: 16px;

    a:not(:last-child) {
      display: none;
    }
  }
`

export const NavAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  border: 2px solid rgba(167, 139, 250, 0.4);
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

export const NavCta = styled.a`
  background: linear-gradient(135deg, #7c3aed, #6d28d9) !important;
  color: #ffffff !important;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600 !important;
  transition: opacity 0.2s !important;

  &:hover {
    opacity: 0.9;
    color: #ffffff !important;
  }
`

export const PageContent = styled.main`
  width: 100%;
  max-width: 700px;
  padding: 0 20px 60px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 640px) {
    padding: 0 16px 40px;
  }
`

export const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  text-align: center;
`

export const TitleIconWrapper = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(167, 139, 250, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124, 58, 237, 0.1);
  color: #a78bfa;
`

export const PageTitle = styled.h1`
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -1px;
  line-height: 1.1;
  margin: 0;
`

export const FormCard = styled.div`
  width: 100%;
  background: rgba(15, 15, 40, 0.85);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 20px;
  padding: 36px;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 28px;

  @media (max-width: 640px) {
    padding: 24px 20px;
    gap: 24px;
    border-radius: 16px;
  }
`

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const Label = styled.label`
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 0.1px;
`

export const Input = styled.input`
  width: 100%;
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder {
    color: #4b5563;
  }

  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }
`

export const Textarea = styled.textarea`
  width: 100%;
  background: rgba(10, 10, 30, 0.7);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 14px;
  color: #e2e8f0;
  outline: none;
  resize: vertical;
  min-height: 110px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &::placeholder {
    color: #4b5563;
  }

  &:focus {
    border-color: rgba(124, 58, 237, 0.6);
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
  }
`

export const CategoryTagsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

interface CategoryTagProps {
  $active?: boolean
}

export const CategoryTag = styled.button<CategoryTagProps>`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.18s ease;
  white-space: nowrap;

  ${({ $active }) =>
    $active
      ? css`
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: #ffffff;
          border-color: transparent;
        `
      : css`
          background: rgba(15, 15, 40, 0.6);
          color: #c4b5fd;
          border-color: rgba(124, 58, 237, 0.3);

          &:hover {
            background: rgba(124, 58, 237, 0.15);
            border-color: rgba(124, 58, 237, 0.5);
            color: #ffffff;
          }
        `}
`

export const ExpandCategoriesButton = styled.button`
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid rgba(124, 58, 237, 0.3);
  background: rgba(15, 15, 40, 0.6);
  color: #c4b5fd;
  display: flex;
  align-items: center;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(124, 58, 237, 0.15);
    border-color: rgba(124, 58, 237, 0.5);
    color: #ffffff;
  }
`

export const CoverImageRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 20px;

  @media (max-width: 500px) {
    flex-direction: column;
    align-items: stretch;
  }
`

export const CoverImageLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`

export const CoverImageInputRow = styled.div`
  display: flex;
  gap: 8px;
`

export const UploadButton = styled.button`
  padding: 13px 18px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.35);
  border-radius: 10px;
  color: #c4b5fd;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: rgba(124, 58, 237, 0.28);
    color: #ffffff;
  }
`

export const CoverPreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(124, 58, 237, 0.3);
  background: rgba(10, 10, 30, 0.7);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 500px) {
    width: 100%;
    height: 160px;
  }
`

export const CoverPreviewPlaceholder = styled.div`
  color: #4b5563;
  font-size: 12px;
  text-align: center;
  padding: 8px;
`

export const ActionRow = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`

export const DraftButton = styled.button`
  flex: 1;
  padding: 15px 24px;
  background: rgba(15, 15, 40, 0.8);
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 12px;
  color: #e2e8f0;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(124, 58, 237, 0.1);
    border-color: rgba(124, 58, 237, 0.5);
    color: #ffffff;
  }
`

export const PublishButton = styled.button`
  flex: 1;
  padding: 15px 24px;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  letter-spacing: 0.2px;

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`
