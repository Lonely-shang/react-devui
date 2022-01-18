import type { DHeaderProps } from '../_header';

import { useCallback } from 'react';

import { usePrefixConfig, useComponentConfig, useCustomContext } from '../../hooks';
import { generateComponentMate, getClassName } from '../../utils';
import { DHeader } from '../_header';
import { DDrawerContext } from './Drawer';

export type DDrawerHeaderProps = Omit<DHeaderProps, 'onClose'>;

const { COMPONENT_NAME } = generateComponentMate('DDrawerHeader');
export function DDrawerHeader(props: DDrawerHeaderProps) {
  const { className, ...restProps } = useComponentConfig(COMPONENT_NAME, props);

  //#region Context
  const dPrefix = usePrefixConfig();
  const [{ drawerId, closeDrawer }] = useCustomContext(DDrawerContext);
  //#endregion

  const handleClose = useCallback(() => {
    closeDrawer?.();
  }, [closeDrawer]);

  return (
    <DHeader
      {...restProps}
      id={drawerId ? `${dPrefix}drawer-header-${drawerId}` : undefined}
      className={getClassName(className, `${dPrefix}drawer-header`)}
      onClose={handleClose}
    ></DHeader>
  );
}
