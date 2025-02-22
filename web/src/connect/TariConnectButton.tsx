import * as React from 'react';

import Button from "@mui/material/Button";
import TariLogoWhite from './content/tari-logo-white.svg';
import {TariWalletSelectionDialog} from './TariWalletSelectionDialog';
import {TariProvider} from '@tari-project/tarijs';

interface Props {
    provider?: TariProvider;
    onConnected?: (provider: TariProvider) => void;
}

export function TariConnectButton(props: Props) {
    const {onConnected, provider} = props;
    const [walletSelectionOpen, setWalletSelectionOpen] = React.useState(false);

    const handleConnectClick = () => {
        setWalletSelectionOpen(true);
    };

    const onWalletSelectionClose = () => {
        setWalletSelectionOpen(false);
    };

    const handleOnConnected = (provider: TariProvider) => {
        onConnected?.(provider);
    };

    return (
        <>
            <Button variant='contained' onClick={handleConnectClick}>
                <img width="30px" height="30px" src={TariLogoWhite}/>
                <div style={{paddingLeft: '10px'}}>{provider?.isConnected() ? "Connected" : "Connect"}</div>
            </Button>
            <TariWalletSelectionDialog
                open={walletSelectionOpen}
                onClose={onWalletSelectionClose}
                onConnected={handleOnConnected}
            />
        </>
    );
}