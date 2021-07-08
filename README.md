This application contains the logic and models needed to help charities manage their manpower. Our application is called Givehub and we aim to create a human resource manager which also doubles up as a social media platform. 

We used type-graphql to get a GraphQL server up and running, and we are currently hosting our server on a VPS with a purchased domain name. GraphQL allowed us to work on our projects separately while making good progress on our application. Since GraphQL allows for a playground, both of us could head over to the playground to test out GraphQL queries that could be used to access the system.

Furthermore, by controlling the IP addresses and domains which could access this server, we controlled access into the server and restricted it to only our IP addresses. This will be changed we are ready to launch our product.

We also used a Redis server to store key-value pairs to store cookies and information about our logged in users. This, along with Express middleware, means that we can easily control session data on our system.

Typeorm was used to map objects onto the Postgres database that was used to store the data. This allowed for easier control of data. While it was initially difficult to get an understanding of how it worked, experience allowed us to gain a rough understanding of it and allowed us to use the ORM. Typeorm also allows for easy migrations, which made deployment very easy.

On top of this, Docker was used to dockerise and containerise the application. This is important as it allowed for easy version control and maintained a form of "continuous deployment". 