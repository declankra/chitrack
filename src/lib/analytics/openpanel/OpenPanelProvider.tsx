'use client'

import { OpenPanelComponent } from '@openpanel/nextjs'

export function OpenPanelProvider() {
  // Determine which client ID to use based on environment
  const clientId = process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_OPENPANEL_PROD_CLIENT_ID
    : process.env.NEXT_PUBLIC_OPENPANEL_DEV_CLIENT_ID

  // Don't render if no client ID is configured
  if (!clientId) {
    console.warn('OpenPanel client ID not configured for this environment')
    return null
  }

  return (
    <OpenPanelComponent
      clientId={clientId}
      // Enable basic page view tracking
      trackScreenViews={true}
      // Disabled by default - enable these when needed
      trackOutgoingLinks={true} 
      trackAttributes={true}
    />
  )
}

/*
EXAMPLE USAGE

import { useOpenPanel } from '@openpanel/nextjs'

function YourComponent() {
  const op = useOpenPanel()
  
  const handleClick = () => {
    op.track('button_clicked', { 
      location: 'hero_section',
      action: 'signup'
    })
  }

  return <button onClick={handleClick}>Sign Up</button>
}

*/