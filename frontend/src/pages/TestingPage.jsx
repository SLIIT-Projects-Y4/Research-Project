import React from 'react';
import LocationCard from "../components/features/location-card/LocationCard.jsx";

const TestingPage = () => {
    return (
      <div className={`mx-auto p-6`}>
          <LocationCard
            name={'Arugam Bay'}
            city={'Ampara'}
            province={'Eastern Province'}
            type={'Beaches'}
            description={'A crescent-shaped stretch of golden sand on Sri Lanka\'s eastern coast, Arugam Bay Beach is a surfer\'s paradise with consistent waves at spots like Main Point and Baby Point. Its laid-back vibe features rustic guesthouses, quirky cafes, and a mix of Sinhalese, Tamil, and Muslim communities. Nearby attractions include Lahugala National Park (wild elephants) and Kudimbigala Forest Hermitage. Despite tourism growth, it retains its eccentric charm.'}
            noOfRatings={133}
            rating={3.4}
            onHeartIconClick={() => console.log('Heart')}
            onDetailsButtonClick={() => console.log('Details')}
            onAddToPlanPoolButtonClick={() => console.log('Add to plan')}
          />
      </div>
    );
};

export default TestingPage;