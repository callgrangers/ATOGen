// ==========================================
// APP: DISCLAIMER / MISSION STATEMENT
// ==========================================

function openDisclaimerApp() {
    document.getElementById('modal-back-text').innerText = 'CLEAR';
    document.getElementById('modal-back-btn').onclick = () => closeModal();
    document.getElementById('modal-title').innerHTML = `<span style="filter:none !important; text-shadow:none !important; margin-right:8px;">🧾</span>OUR MISSION`;
    document.getElementById('modal-subtitle').innerText = 'Our Mission | ATOG(en)';

    const container = document.getElementById('modal-body-container');
    container.innerHTML = `
        <div class="disclaimer-shell fade-in">
            <section class="disclaimer-hero">
                <p class="disclaimer-eyebrow">ATOG(en) Project</p>
                <h3>Disclaimer & Mission Statement</h3>
                <p class="disclaimer-lede">
                    Built to point hearts toward Christ and support daily Scripture engagement through thoughtful, practical tools.
                </p>
            </section>

            <section class="disclaimer-grid">
                <article class="disclaimer-card span-2">
                    <h4>Project Foundation</h4>
                    <p>
                        The content, tools, and resources provided within the ATOG(en) Application are the result of many years of personal study, research, biblical reflection, and structured data analysis. These materials represent an effort to thoughtfully organize and present biblical concepts, themes, and learning tools in a way that is accessible, practical, and useful for everyday study and discipleship.
                    </p>
                </article>

                <article class="disclaimer-card span-2">
                    <h4>Core Mission</h4>
                    <p>
                        The core mission of the ATOG(en) project is to help point people to Jesus Christ and to provide accessible tools that encourage deeper engagement with Scripture. The application is designed to empower individuals to grow in their understanding of the Bible, strengthen their faith, and participate more fully in the lifelong process of learning, spiritual growth, and discipleship. Every feature within the platform is intended to serve that purpose - to help make biblical exploration clearer, more structured, and more approachable for anyone who desires to learn.
                    </p>
                </article>

                <article class="disclaimer-card">
                    <h4>Free Access</h4>
                    <p>
                        All applications and resources provided through ATOG(en) are offered free of charge for personal use. This project exists to remove barriers to learning and to make helpful study tools available to anyone seeking to explore the message of the Bible and the hope found in Christ.
                    </p>
                </article>

                <article class="disclaimer-card">
                    <h4>Guidance</h4>
                    <p>
                        While care has been taken to present information accurately and responsibly, the materials within this application are not intended to replace personal Bible study, the guidance of Scripture itself, or the wisdom of faithful pastoral leadership and local church communities. Users are encouraged to study the Scriptures directly and to engage with trusted spiritual mentors as they grow in their faith.
                    </p>
                </article>

                <article class="disclaimer-card span-2">
                    <h4>Support & Collaboration</h4>
                    <p>
                        For those who desire deeper customization, expanded tools, ministry integration, or personalized implementations, additional support may be available. If you would like to explore these possibilities, ask questions, or provide feedback about the platform, please feel free to reach out to the developer through the Contact page.
                    </p>
                </article>

                <article class="disclaimer-card span-2">
                    <h4>Final Hope</h4>
                    <p>
                        The hope behind this project is simple: that these tools might serve as a small aid in helping others learn the Scriptures, grow in Christ, and faithfully disciple others.
                    </p>
                </article>
            </section>

            <div style="margin-top:16px; display:flex; justify-content:center;">
                <button id="disclaimer-contact-btn" class="clear-btn" style="border-color:#22d3ee; color:#22d3ee; font-weight:800; letter-spacing:0.8px;">
                    CONTACT DEVELOPER
                </button>
            </div>
        </div>
    `;

    const disclaimerContactBtn = document.getElementById('disclaimer-contact-btn');
    if (disclaimerContactBtn) {
        disclaimerContactBtn.onclick = () => {
            window.open('pages/developer.html', '_blank', 'noopener');
        };
    }

    document.getElementById('data-modal').classList.add('active');
    bounceModalBodyToTop();
    lucide.createIcons();
}

window.openDisclaimerApp = openDisclaimerApp;