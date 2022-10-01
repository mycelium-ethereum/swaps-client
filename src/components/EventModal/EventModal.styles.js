import styled from 'styled-components';
import Modal from '../Modal/Modal';

export const EventModalHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 157px;
  width: 100%;
  background-color: var(--background-primary);
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
  border-bottom: 0;

`

export const EventModalGraphic = styled.img`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;

  ${({ infront }) => infront ? 
    `
      height: 296px;
      z-index: 1;
    ` : ``
  }
`

export const EventModalTitle = styled.div`
  margin-bottom: 1rem;
  small {
    display: block;
    font-size: 24px;
    line-height: 36px;
    font-weight: 600;
  }
  h2 {
    font-size: 36px;
    line-height: 48px;
    font-weight: 600;
    margin: 0 0 16px;
  }
`

export const EventModalDivider = styled.hr`
  border-color: var(--cell-stroke);
  margin: 0 0 16px;
`

export const EventModalButtonContent = styled.div`
  display: grid;
  row-gap: 16px;

  span {
    font-weight: 300;
  }

  a, button {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    height: 44px;
    margin: 0;
    background: var(--action-active);

    img {
      margin-left: 13px;
    }
  }
`

export const EventModal = styled(Modal)`
  .Modal-content {
    max-width: 424px;
    width: 100%;
    overflow: unset;
  }
  .Modal-body {
    padding-top: 120px;
    text-align: center;
  }
  .divider {
    display: none;
  }

  @media (max-width: 450px) {
    .Modal-content {
      max-width: calc(100% - 32px);
    }
    ${EventModalTitle} {
      small {
        display: block;
        font-size: 20px;
        line-height: 30px;
        font-weight: 600;
      }
      h2 {
        font-size: 30px;
        line-height: 40px;
      }
    }
  }
`
