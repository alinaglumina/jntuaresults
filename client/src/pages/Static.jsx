export function About() {
  return (
    <section className="wrap narrow">
      <div className="sec-head"><span className="bar" /><h2>About the Center</h2></div>
      <div className="card pad">
        <p>The JNTUA Examination Information Center publishes the examination results of Jawaharlal Nehru Technological University Anantapur in one place. Select <b>Show</b> against a result to open it.</p>
        <p>For official notifications, circulars and other university information, visit the <a href="https://www.jntua.ac.in" target="_blank" rel="noopener noreferrer">JNTUA website</a>.</p>
      </div>
    </section>
  );
}
export function Contact() {
  return (
    <section className="wrap narrow">
      <div className="sec-head"><span className="bar" /><h2>Contact Us</h2></div>
      <div className="card pad contact">
        <h3>Examination Helpline Center</h3>
        <p className="crow"><span className="clabel">Off:</span> <a href="tel:+918554242438">08554-242438</a></p>
        <p className="crow"><span className="clabel">Email:</span> <a href="mailto:ce.office@jntua.ac.in">ce.office@jntua.ac.in</a></p>
        <hr />
        <p className="caddr"><b>Jawaharlal Nehru Technological University Anantapur</b><br />Ananthapuramu, Andhra Pradesh, India, Pin: 515002<br /><a href="https://www.jntua.ac.in" target="_blank" rel="noopener noreferrer">www.jntua.ac.in</a></p>
      </div>
    </section>
  );
}
