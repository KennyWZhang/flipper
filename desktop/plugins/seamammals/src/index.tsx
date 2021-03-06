/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {
  Text,
  Panel,
  ManagedDataInspector,
  DetailSidebar,
  FlexRow,
  FlexColumn,
  styled,
  colors,
} from 'flipper';
import React, {memo} from 'react';

import {PluginClient, usePlugin, createState, useValue} from 'flipper-plugin';

type Row = {
  id: number;
  title: string;
  url: string;
};

type Events = {
  newRow: Row;
};

export function plugin(client: PluginClient<Events, {}>) {
  const rows = createState<Record<string, Row>>({}, {persist: 'rows'});
  const selectedID = createState<string | null>(null, {persist: 'selection'});

  client.addMenuEntry(
    {
      label: 'Reset Selection',
      topLevelMenu: 'Edit',
      handler: () => {
        selectedID.set(null);
      },
    },
    {
      action: 'createPaste',
      handler: async () => {
        const selection = selectedID.get();
        if (selection) {
          const url = await client.createPaste(
            JSON.stringify(rows.get()[selection], null, 2),
          );
          alert(url); // TODO: use notifications T69990351
        }
      },
    },
  );

  client.onMessage('newRow', (row) => {
    rows.update((draft) => {
      draft[row.id] = row;
    });
  });

  function setSelection(id: number) {
    selectedID.set('' + id);
  }

  return {
    rows,
    selectedID,
    setSelection,
  };
}

export function Component() {
  const instance = usePlugin(plugin);
  const rows = useValue(instance.rows);
  const selectedID = useValue(instance.selectedID);

  return (
    <Container>
      {Object.entries(rows).map(([id, row]) => (
        <Card
          row={row}
          onSelect={instance.setSelection}
          selected={id === selectedID}
          key={id}
        />
      ))}
      <DetailSidebar>
        {selectedID && renderSidebar(rows[selectedID])}
      </DetailSidebar>
    </Container>
  );
}

function renderSidebar(row: Row) {
  return (
    <Panel floating={false} heading={'Extras'}>
      <ManagedDataInspector data={row} expandRoot={true} />
    </Panel>
  );
}

type CardProps = {
  onSelect: (id: number) => void;
  selected: boolean;
  row: Row;
};
const Card = memo(({row, selected, onSelect}: CardProps) => {
  return (
    <CardContainer
      data-testid={row.title}
      onClick={() => onSelect(row.id)}
      selected={selected}>
      <Image style={{backgroundImage: `url(${row.url || ''})`}} />
      <Title>{row.title}</Title>
    </CardContainer>
  );
});

const Container = styled(FlexRow)({
  backgroundColor: colors.macOSTitleBarBackgroundBlur,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  alignContent: 'flex-start',
  flexGrow: 1,
  overflow: 'scroll',
});

const CardContainer = styled(FlexColumn)<{selected?: boolean}>((props) => ({
  margin: 10,
  borderRadius: 5,
  border: '2px solid black',
  backgroundColor: colors.white,
  borderColor: props.selected ? colors.macOSTitleBarIconSelected : colors.white,
  padding: 0,
  width: 150,
  overflow: 'hidden',
  boxShadow: '1px 1px 4px rgba(0,0,0,0.1)',
  cursor: 'pointer',
}));

const Image = styled.div({
  backgroundSize: 'cover',
  width: '100%',
  paddingTop: '100%',
});

const Title = styled(Text)({
  fontSize: 14,
  fontWeight: 'bold',
  padding: '10px 5px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
